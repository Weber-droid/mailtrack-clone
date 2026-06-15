# SendBeacon — Browser Extension

Chromium extension (Chrome, Brave, Edge) for Gmail email tracking.

## Install (development)

1. Start the backend: `cd backend && PYTHONPATH=. uvicorn app.main:app --reload --port 8000`
2. Open `brave://extensions` or `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** and select this `extension/` folder
5. Click the extension icon → sign in or register
6. Set API URL to `http://localhost:8000`

## Usage

1. Open Gmail and compose an email
2. Use the **Track opens** / **Track links** toggles at the top of compose
3. Click **Send** — the extension registers the email, injects the pixel, and rewrites links
4. View results on the web dashboard at `http://localhost:3000/dashboard`

## Google OAuth in extension

For Google Sign-In in the extension popup, configure a Chrome Extension OAuth client in Google Cloud Console with redirect URI:

```
https://<your-extension-id>.chromiumapp.org/
```

## Permissions

- `storage` — save auth token and settings
- `identity` — optional Google OAuth via Chrome identity API
- `notifications` — alert on opens/clicks
- `host_permissions` — Gmail + your API server

## Notes

- Gmail DOM selectors may break when Google updates Gmail
- `localhost` tracking URLs only work for local testing; deploy backend publicly for real recipients
- Use the same account as the web dashboard
