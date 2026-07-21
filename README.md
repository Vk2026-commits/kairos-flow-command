# Kairos Flow Command

## Google Maps on a custom domain

Lovable's managed Google Maps connection only works on `*.lovable.app` domains.
For a published custom domain, add your own Google Maps Platform keys to the
hosting environment:

```env
VITE_GOOGLE_MAPS_BROWSER_KEY=your_browser_key
GOOGLE_MAPS_STATIC_API_KEY=your_static_maps_key
```

The browser key powers the live interactive map. Restrict it to your Lovable
preview domain and your custom domain, and enable Maps JavaScript API and Places
API.

The static key powers map snapshots/export through the app server. Enable Static
Maps API for it. If your hosting provider only supports one server-side Maps
key, use `GOOGLE_MAPS_API_KEY` instead of `GOOGLE_MAPS_STATIC_API_KEY`.

Keep real keys in your host's environment settings or a local `.env` file. Do
not commit real keys to GitHub.
