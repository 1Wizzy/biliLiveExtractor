# -*- coding: utf-8 -*-
"""
Bilibili live stream URL extractor with QR-code login.
"""

import argparse
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
import qrcode_terminal

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
}

# Request timeout as (connect, read) in seconds.
REQUEST_TIMEOUT = (5, 10)

# Quality code (qn) -> human readable name.
QUALITY_MAP = {
    30000: "Dolby",
    20000: "4K",
    10000: "Original",
    400: "Blu-ray",
    250: "Super HD",
    150: "HD",
    80: "Smooth",
}

# Quality priority from highest to lowest.
QUALITY_PRIORITY = [30000, 20000, 10000, 400, 250, 150, 80]


class BilibiliError(Exception):
    """Raised when a Bilibili API call fails."""


def _stream_identity(url):
    """Return a CDN-independent identity for a stream URL.

    The same logical stream is served from many CDN hosts with different query
    signatures; the path's final segment (e.g. ``live_50329118_9516950_2500.flv``)
    is stable, so it is used to de-duplicate streams across requests.
    """
    if not url:
        return url
    path = url.split("?", 1)[0]
    return path.rsplit("/", 1)[-1] or path


class BilibiliQRCodeLogin:
    GEN_URL = "https://passport.bilibili.com/x/passport-login/web/qrcode/generate"
    POLL_URL = "https://passport.bilibili.com/x/passport-login/web/qrcode/poll"

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(
            {
                **DEFAULT_HEADERS,
                "Referer": "https://www.bilibili.com/",
                "Origin": "https://www.bilibili.com",
            }
        )

    def generate_qrcode(self):
        """Generate a login QR code, returning (qrcode_key, url)."""
        resp = self.session.get(self.GEN_URL, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        if data.get("code") != 0:
            raise BilibiliError(f"Failed to generate QR code: {data.get('message', data)}")
        payload = data["data"]
        return payload["qrcode_key"], payload["url"]

    def login(self, timeout=180, interval=3):
        try:
            qrcode_key, url = self.generate_qrcode()
        except (requests.RequestException, BilibiliError, KeyError) as exc:
            print(f"Failed to generate QR code: {exc}")
            return None

        print("Scan the QR code to log in:", url)
        qrcode_terminal.draw(url)

        deadline = time.time() + timeout
        last_code = None
        while time.time() < deadline:
            try:
                resp = self.session.get(
                    self.POLL_URL,
                    params={"qrcode_key": qrcode_key},
                    timeout=REQUEST_TIMEOUT,
                )
                resp.raise_for_status()
                js = resp.json()
            except (requests.RequestException, ValueError) as exc:
                print(f"Poll failed, retrying: {exc}")
                time.sleep(interval)
                continue

            code = js.get("data", {}).get("code")
            if code == 0:
                print("Login successful!")
                return self.session.cookies.get_dict()
            if code == 86038:
                print("QR code expired, please regenerate.")
                return None
            if code == 86090 and last_code != 86090:
                print("Scanned, waiting for confirmation...")
            last_code = code
            time.sleep(interval)

        print("Login timed out.")
        return None


class BilibiliLiveStreamExtractor:
    ROOM_INFO_URL = "https://api.live.bilibili.com/room/v1/Room/get_info"
    PLAY_INFO_URL = (
        "https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo"
    )

    def __init__(self, cookies=None):
        self.session = requests.Session()
        self.session.headers.update(
            {
                **DEFAULT_HEADERS,
                "Referer": "https://live.bilibili.com/",
                "Origin": "https://live.bilibili.com",
            }
        )
        if cookies:
            self.session.cookies.update(cookies)

    @staticmethod
    def extract_room_id(url):
        """Extract the room id from a live room URL or a bare number."""
        if not url:
            return None
        url = url.strip()
        if url.isdigit():
            return url
        match = re.search(r"live\.bilibili\.com/(?:\w+/)?(\d+)", url)
        if match:
            return match.group(1)
        return None

    def resolve_short_url(self, url):
        """Follow a b23.tv short link to its final URL, else return as-is."""
        value = (url or "").strip()
        if not re.search(r"(?:^|//)(?:www\.)?b23\.tv/", value):
            return value
        if not re.match(r"^https?://", value):
            value = f"https://{value}"
        try:
            resp = self.session.get(
                value, allow_redirects=True, timeout=REQUEST_TIMEOUT
            )
            return resp.url or value
        except requests.RequestException:
            return value

    def resolve_room_id(self, url):
        """Resolve a room id from an id, live URL, or b23.tv short link."""
        room_id = self.extract_room_id(url)
        if room_id:
            return room_id
        return self.extract_room_id(self.resolve_short_url(url))

    def get_room_info(self, room_id):
        try:
            resp = self.session.get(
                self.ROOM_INFO_URL,
                params={"room_id": room_id},
                timeout=REQUEST_TIMEOUT,
            )
            resp.raise_for_status()
            data = resp.json()
        except (requests.RequestException, ValueError) as exc:
            raise BilibiliError(f"Failed to fetch room info: {exc}") from exc
        if data.get("code") == 0:
            return data["data"]
        raise BilibiliError(f"Failed to fetch room info: {data.get('message', data)}")

    def get_all_stream_urls(self, room_id, max_workers=4):
        """Fetch stream URLs for every quality concurrently.

        Bilibili often downgrades the response: requesting a higher qn than the
        account/room allows (e.g. any qn without login) returns a lower-quality
        stream with its real level in ``current_qn``. Streams are therefore
        grouped by the *actual* ``current_qn`` returned, not by the requested
        qn, and identical streams returned for several requests are de-duplicated
        so the same stream is never labelled as multiple qualities.
        """
        all_streams = {}
        seen = set()
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_qn = {
                executor.submit(self.get_play_url, room_id, qn): qn
                for qn in QUALITY_MAP
            }
            for future in as_completed(future_to_qn):
                qn = future_to_qn[future]
                try:
                    streams = future.result()
                except BilibiliError as exc:
                    print(f"Failed to fetch {QUALITY_MAP[qn]} stream: {exc}")
                    continue
                if not streams:
                    continue
                for stream_key, entries in streams.items():
                    for entry in entries:
                        actual_qn = entry["current_qn"]
                        dedup_key = (actual_qn, stream_key, _stream_identity(entry["url"]))
                        if dedup_key in seen:
                            continue
                        seen.add(dedup_key)
                        bucket = all_streams.setdefault(
                            actual_qn,
                            {
                                "quality_name": QUALITY_MAP.get(
                                    actual_qn, f"Unknown({actual_qn})"
                                ),
                                "streams": {},
                            },
                        )
                        bucket["streams"].setdefault(stream_key, []).append(entry)
        return all_streams

    def get_play_url(self, room_id, qn=10000):
        params = {
            "room_id": room_id,
            "no_playurl": 0,
            "mask": 0,
            "qn": qn,
            "platform": "web",
            "protocol": "0,1",
            "format": "0,1,2",
            "codec": "0,1,2",
        }
        try:
            resp = self.session.get(
                self.PLAY_INFO_URL, params=params, timeout=REQUEST_TIMEOUT
            )
            resp.raise_for_status()
            data = resp.json()
        except (requests.RequestException, ValueError) as exc:
            raise BilibiliError(f"Failed to request play URL: {exc}") from exc
        if data.get("code") == 0 and "playurl_info" in data.get("data", {}):
            playurl_info = data["data"]["playurl_info"]
            if playurl_info and "playurl" in playurl_info:
                return self.parse_all_streams(playurl_info["playurl"])
        return None

    @staticmethod
    def parse_all_streams(play_info):
        streams = {}
        for stream in play_info.get("stream", []):
            protocol_name = stream.get("protocol_name", "unknown")
            for format_info in stream.get("format", []):
                format_name = format_info.get("format_name", "unknown")
                for codec in format_info.get("codec", []):
                    codec_name = codec.get("codec_name", "unknown")
                    current_qn = codec.get("current_qn", 0)
                    base_url = codec.get("base_url", "")
                    stream_key = f"{protocol_name}_{format_name}_{codec_name}"
                    for url_info in codec.get("url_info", []):
                        full_url = (
                            url_info.get("host", "")
                            + base_url
                            + url_info.get("extra", "")
                        )
                        streams.setdefault(stream_key, []).append(
                            {
                                "url": full_url,
                                "protocol": protocol_name,
                                "format": format_name,
                                "codec": codec_name,
                                "current_qn": current_qn,
                                "quality_name": QUALITY_MAP.get(
                                    current_qn, f"Unknown({current_qn})"
                                ),
                            }
                        )
        return streams

    @staticmethod
    def print_stream_info(all_streams):
        print("\n" + "=" * 80)
        print("Bilibili live stream URLs")
        print("=" * 80)
        for qn, stream_info in sorted(all_streams.items(), reverse=True):
            streams = stream_info["streams"]
            if not streams:
                continue
            print(f"\n[{stream_info['quality_name']} - {qn}]")
            for stream_key, stream_list in streams.items():
                protocol, fmt, codec = stream_key.split("_", 2)
                print(f"\n  > {protocol.upper()} - {fmt.upper()} - {codec.upper()}")
                for i, stream in enumerate(stream_list):
                    print(f"    [{i + 1}] {stream['url']}")

    @staticmethod
    def get_best_streams(all_streams):
        """Return the single highest-quality stream by priority."""
        preferred_keys = [
            "http_stream_flv_avc",
            "http_stream_flv_hevc",
            "http_hls_ts_avc",
            "http_hls_ts_hevc",
        ]
        for qn in QUALITY_PRIORITY:
            info = all_streams.get(qn)
            if not info or not info["streams"]:
                continue
            streams = info["streams"]
            for key in preferred_keys:
                if streams.get(key):
                    return {info["quality_name"]: streams[key][0]["url"]}
        return {}


def _get_anchor_name(room_info):
    """Safely extract the anchor name, returning Unknown when missing."""
    pendants = room_info.get("new_pendants") or {}
    badge = pendants.get("badge") or {}
    return badge.get("desc") or "Unknown"


def main(live_url, all_stream):
    login = BilibiliQRCodeLogin()
    cookies = login.login()
    if not cookies:
        print("Login failed, exiting.")
        return

    extractor = BilibiliLiveStreamExtractor(cookies=cookies)
    room_id = extractor.resolve_room_id(live_url)
    if not room_id:
        print("Could not extract room id.")
        return

    try:
        room_info = extractor.get_room_info(room_id)
    except BilibiliError as exc:
        print(exc)
        return

    print(f"Room id: {room_id}")
    print(
        f"Title: {room_info.get('title', 'Unknown')} "
        f"Anchor: {_get_anchor_name(room_info)}"
    )
    if room_info.get("live_status") != 1:
        print("Not currently live.")
        return

    all_streams = extractor.get_all_stream_urls(room_id)
    if not all_streams:
        print("No stream URLs found.")
        return

    if all_stream:
        extractor.print_stream_info(all_streams)

    best = extractor.get_best_streams(all_streams)
    if best:
        print("\n" + "=" * 80)
        print("Recommended best stream (highest quality)")
        print("=" * 80)
        for quality, url in best.items():
            print(f"\n[{quality}]\n{url}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract Bilibili Live Stream")
    parser.add_argument("live_url", help="Live room URL or room id")
    parser.add_argument(
        "-all", "--allstream", help="Print all quality streams", action="store_true"
    )
    args = parser.parse_args()
    main(live_url=args.live_url, all_stream=args.allstream)
