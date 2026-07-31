# Bilibili Live Stream Extractor

[![GitHub stars](https://img.shields.io/github/stars/1Wizzy/biliLiveExtractor?style=flat-square)](https://github.com/1Wizzy/biliLiveExtractor/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/1Wizzy/biliLiveExtractor?style=flat-square)](https://github.com/1Wizzy/biliLiveExtractor/network/members)
[![License](https://img.shields.io/github/license/1Wizzy/biliLiveExtractor?style=flat-square)](./LICENSE)

**Live Instances:**

- 🌍 [bili-live-extractor.wizzyang.qzz.io](https://bili-live-extractor.wizzyang.qzz.io) (Accelerated by Cloudflare)
- 🚀 [bili-live-extractor.vercel.app](https://bili-live-extractor.vercel.app) (Hosted by Vercel)

Extract playable stream URLs from Bilibili live rooms with:

- **Web app**: static frontend + Vercel serverless proxy
- **CLI**: Python script for terminal usage

QR login is optional, but enables higher qualities like **Original / 4K / Dolby**.

⭐ If this project helps you, please star it on GitHub.

---

## Features

- Accepts room input as:
  - full live URL (`https://live.bilibili.com/12345`)
  - room ID (`12345`)
  - short link (`b23.tv/xxxx`)
- Optional QR-code login for premium qualities
- Returns best stream URL quickly
- Supports listing all available quality/protocol/codec combinations
- Browser-side cookie storage only (not persisted server-side)

## Project Structure

```text
public/            Static frontend (HTML/CSS/JS, no build step)
api/
  _lib/bili.js     Shared Bilibili helpers
  qrcode/
    generate.js    Generate login QR code
    poll.js        Poll login status and capture cookies
  room.js          GET /api/room?input=<url|id|b23.tv>
  streams.js       GET /api/streams?input=<url|id|b23.tv>
vercel.json        Serverless function config
```

## Quick Start

### Web App (Vercel)

```bash
npm i -g vercel
vercel        # preview
vercel --prod # production
```

Or import this repository at [vercel.com/new](https://vercel.com/new).

### Local Development

```bash
vercel dev
```

Then open `http://localhost:3000`.

### CLI

```bash
pip install -r requirements.txt
python Bilibili_Live_Stream_Extractor.py <live_url_or_room_id>
python Bilibili_Live_Stream_Extractor.py 12345 --allstream
```

## Security & Cookie Handling

- Cookies are captured from Bilibili only after successful QR confirmation.
- Cookies are stored in browser `localStorage`.
- Cookies are sent to backend APIs only through the `x-bili-cookies` header.
- No cookie persistence is performed on the server.

## Star History

<p align="center">
<a href="https://www.star-history.com/?repos=1Wizzy%2FbiliLiveExtractor&type=date&legend=bottom-right">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=1Wizzy/biliLiveExtractor&type=date&theme=dark&legend=bottom-right&sealed_token=mnrmWv-BJkS7fkxZYCJUm8rAgiGr5uVNGFXkWk_1slzK9jKjMA6Euo5GLi37HGsid83VrX14kOZsL87x7Ps0ejkKgj27fkQYlig47FR5gNLR37o_oDIabA" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=1Wizzy/biliLiveExtractor&type=date&legend=bottom-right&sealed_token=mnrmWv-BJkS7fkxZYCJUm8rAgiGr5uVNGFXkWk_1slzK9jKjMA6Euo5GLi37HGsid83VrX14kOZsL87x7Ps0ejkKgj27fkQYlig47FR5gNLR37o_oDIabA" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=1Wizzy/biliLiveExtractor&type=date&legend=bottom-right&sealed_token=mnrmWv-BJkS7fkxZYCJUm8rAgiGr5uVNGFXkWk_1slzK9jKjMA6Euo5GLi37HGsid83VrX14kOZsL87x7Ps0ejkKgj27fkQYlig47FR5gNLR37o_oDIabA" />
 </picture>
</a>
</p>



## Notes

- Stream URLs are time-limited and may expire.
- For personal use only. Please respect Bilibili's terms of service.
