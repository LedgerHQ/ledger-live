---
"ledger-live-desktop": minor
"@ledgerhq/coin-zcash": patch
"@ledgerhq/hw-ledger-key-ring-protocol": patch
---

Run the desktop renderer with `contextIsolation` and `sandbox` enabled, and without `nodeIntegration`.

Previously any XSS, Live App escape or compromised dependency executing in the renderer had full Node available: `child_process`, arbitrary filesystem access, and direct reach into the account database. The renderer now has none of that. It runs in its own JavaScript world inside an OS-level sandbox, and reaches the main process only through an explicit, allow-listed preload bridge declared in one place and imported by both sides.

The three flags have to move together: `sandbox` has defaulted to true since Electron 20 and is auto-disabled only by `nodeIntegration`, so changing that one alone would silently sandbox the renderer *and* strip Node from the preload.

**What moved.** Every `ipcRenderer` call, the application database, device transport (Speculos and the HTTP proxy — real devices talk WebHID straight from the renderer), the auto-updater and deep-link channels, `electron-store`, clipboard, `webFrame` and `shell.openExternal` now go through named bridge methods. The bridge deliberately exposes one method per operation rather than a generic `invoke(channel, ...)` passthrough, which would have re-exposed the whole main-process surface — including `setEncryptionKey` and `isEncryptionKeyCorrect`, together an offline oracle against the account database.

**File dialogs.** Every "prompt for a location and write" is now a single main-side operation. The renderer used to run the save dialog, receive an absolute path and hand it back, which left it an arbitrary-file-write primitive. Main runs the dialog and keeps the path. Cancelling an export is now distinguishable from a failed one, so dismissing a save dialog no longer risks an error state.

**Bundle.** The renderer is built as a web target instead of `electron-renderer`, so Node builtins resolve at build time rather than as runtime `require()` calls, and the bundle has no externals. `process` reads are supplied from a snapshot captured in main at startup — deliberately not a `process/browser` polyfill, which reports `platform === "browser"` and would break frameless-window dragging on macOS, select the wrong USB-troubleshooting branch, and make store builds start self-updating. A build-time guard fails the build on an unguarded `process` read rather than letting it surface as a runtime crash.

Winston is replaced in the renderer by a minimal in-house logger with the same public surface and entry shape; it pulled in `fs`, `os`, `path`, `zlib`, `http`, `https` and `string_decoder` through transports the renderer never used. Device animations (~10 MB) are now code-split per device model and genuinely lazy. ZCash shielded sync receives its IPC channel by injection instead of reaching for `electron`. The key-ring protocol uses `@noble` rather than Node's `crypto`, with new golden vectors pinning the persisted byte format.

No data migration: `localStorage` is keyed by an origin that does not change, and both `app.json` and `lld.json` live in the main process either way.
