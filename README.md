# Bilibili Live Stream Extractor

Extract playable stream URLs from any Bilibili live room. Ships in two forms:

- **Web app** — a static frontend backed by Vercel serverless functions, deployable in one click.
- **CLI** — the original Python script for terminal use.

Login (via QR code) is optional but unlocks higher qualities such as Original, 4K, and Dolby.

## Web app

The browser cannot call Bilibili's APIs directly (CORS and referer checks), so
the frontend talks to serverless functions under `/api/*` that proxy the
requests server-side.

```
public/            Static frontend (HTML/CSS/JS, no build step)
api/
  _lib/bili.js     Shared Bilibili helpers
  qrcode/
    generate.js    POST-less GET: create a login QR code
    poll.js        Poll login status, return captured cookies on success
  room.js          GET /api/room?input=<url, id, or b23.tv short link>
  streams.js       GET /api/streams?input=<url, id, or b23.tv short link>
vercel.json        Serverless function config
```

Login cookies are captured from Bilibili's `Set-Cookie` on a successful scan,
stored in the browser's `localStorage`, and forwarded to the API only via the
`x-bili-cookies` header. They are never persisted server-side.

### Deploy to Vercel

```bash
npm i -g vercel
vercel          # preview deploy
vercel --prod   # production deploy
```

Or push this repo to GitHub and import it at [vercel.com/new](https://vercel.com/new).
No environment variables or build command are required — Vercel serves
`public/` statically and picks up `api/*.js` as functions automatically.

### Local development

```bash
vercel dev      # serves the frontend and functions at http://localhost:3000
```

### Continuous deployment with GitHub Actions

The easiest option is Vercel's native Git integration: import the repo at
[vercel.com/new](https://vercel.com/new) and Vercel auto-deploys every push to
`main` (production) and every PR (preview). No Action needed.

For a custom CI pipeline (run checks before deploying, or avoid the Git
integration), `.github/workflows/deploy.yml` verifies the code, then deploys via
the Vercel CLI — preview for PRs, production for pushes to `main`. It needs three
repository secrets:

1. Create a token at [vercel.com/account/tokens](https://vercel.com/account/tokens)
   → add as `VERCEL_TOKEN`.
2. Link the project once locally to get its IDs:

   ```bash
   vercel link          # creates .vercel/project.json
   cat .vercel/project.json
   ```

   Copy `orgId` → `VERCEL_ORG_ID` and `projectId` → `VERCEL_PROJECT_ID`.
3. Add all three under **Settings → Secrets and variables → Actions** in GitHub.

> If you use Vercel's native Git integration **and** this workflow, you'll get
> duplicate deploys. Pick one — disable the workflow or turn off the Git
> integration in the Vercel project settings.

## CLI

```bash
pip install -r requirements.txt
python Bilibili_Live_Stream_Extractor.py <live_url_or_room_id>
python Bilibili_Live_Stream_Extractor.py 12345 --allstream   # print every quality
```

The script prompts a QR-code login in the terminal, then prints the recommended
best stream (and, with `--allstream`, every available quality/protocol/codec).
The input accepts a full live URL, a bare room id, or a `b23.tv` short link.

## Notes

- Stream URLs are time-limited and issued by Bilibili; refresh if they expire.
- For personal use. Respect Bilibili's terms of service.
