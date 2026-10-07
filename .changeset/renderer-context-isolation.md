---
"ledger-live-desktop": minor
---

Run the desktop renderer with `contextIsolation` and `sandbox` enabled, and without `nodeIntegration`.

Previously any XSS, Live App escape or compromised dependency executing in the renderer had full Node available: `child_process`, arbitrary filesystem access, and unrestricted access to the account database files. The renderer now has none of that. It runs in its own JavaScript world inside an OS-level sandbox, and reaches the main process only through the allow-listed preload bridge, which exposes one method per operation rather than a generic `invoke(channel, ...)` passthrough. The renderer can still read and write its own `app` data through the bridge, as it must to work, and password attempts against the database are throttled in the main process; making encrypted fields unreadable while the app is locked is a separate follow-up.

The three flags have to move together: `sandbox` has defaulted to true since Electron 20 and is auto-disabled only by `nodeIntegration`, so changing that one alone would silently sandbox the renderer *and* strip Node from the preload.

No data migration: `localStorage` is keyed by an origin that does not change, and both `app.json` and `lld.json` live in the main process either way.
