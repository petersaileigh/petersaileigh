# Making Engineroom Log installable

This folder turns the logbook into an installable, offline-launchable app
(its own window, its own icon, no browser chrome) instead of always opening
as a browser tab.

## What's in here

- `engineroom-log_117_1.html` - the app itself (unchanged apart from a few
  tags added to its `<head>` and a small script at the end that registers
  the service worker).
- `manifest.json` - name, icons and colors used when the app is installed.
- `sw.js` - a small offline "shell" cache, so the app's own HTML/icons/manifest
  still load with no internet connection at all.
- `icons/` - app icons generated from the ship illustration already in the
  logbook, matching its existing favicon style.

All four must stay in the same folder, next to each other, exactly as
extracted.

## The one thing that matters: this needs to be *served*, not double-clicked

Browsers only allow installability and offline service workers over a
**secure context** - that means a real `https://` address, or
`http://localhost`. Opening the HTML file directly from disk
(`file:///path/to/engineroom-log_117_1.html`, which is how this app has
been used so far) is *not* a secure context, so on that path:

- The manifest and icons are simply ignored - no "Install app" option ever
  appears.
- The service worker fails to register (silently - the app still opens and
  works exactly as before, it just won't be installable or cache itself for
  offline use).
- Nothing about the logbook's own data/autosave behavior changes either
  way - that already works from a local file, independent of any of this.

So to actually get an installable app, this folder needs to be reachable at
an `http://localhost` (or `https://`) address instead of opened as a file.
A few ways to do that, roughly in order of effort:

### Option A - a one-line local server (quickest to try)

From a terminal, `cd` into this folder and run one of:

```
python3 -m http.server 8000
```

or, if Node is installed:

```
npx serve .
```

Then open `http://localhost:8000/engineroom-log_117_1.html` in Chrome/Edge.
The install icon should now appear in the address bar (or under the
browser's menu -> "Install Engineroom Log..."). This only serves the app
while that terminal command is left running, which is fine for testing but
not for day-to-day use on a ship where the machine may reboot or the
terminal may get closed.

### Option B - host it properly (best for actual day-to-day use)

Put this folder on any plain static web host reachable from the machines
that use it - that could be:
- A small always-on box on the same network (a NAS, a Raspberry Pi, an old
  laptop) running a static file server, so it's available at something like
  `http://<that-machine's-address>:8000/`.
- Any external static hosting service, if the logbook computers have
  internet access and that's acceptable for this data.

Either way, once it's served over `http://` or `https://`, every device
that opens it in Chrome/Edge can install it as a standalone app and use it
offline afterwards (the app shell loads from the service worker's cache;
the logbook's own data continues to load/save through the shared file
exactly as it does today).

### Option C - skip installability, keep using it as-is

If none of the above is worth the trouble, nothing needs to change -
opening the HTML file directly still works exactly as it always has. The
manifest/service-worker additions are inert until served over http(s), so
they cost nothing by just sitting there unused.

## Updating the app later

Whenever `engineroom-log_117_1.html` is replaced with a newer version,
bump `CACHE_NAME` at the top of `sw.js` (e.g. `v1` -> `v2`) so the service
worker knows to fetch and cache the new file instead of serving the old one
from its cache. Without that bump, an already-installed app may keep
showing the old version for a while even after the file is swapped out
until the cache naturally expires/updates.
