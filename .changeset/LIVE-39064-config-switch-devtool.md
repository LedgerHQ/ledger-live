---
"@shared/app-config": minor
"@devtools/app-config": minor
"@devtools/bindings": minor
"@devtools/registry": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Add the App config devtool: it shows the default option of the build, then lists each app config switch with its options and their values, the option the session runs on and the one saved for the next. Selecting an option saves its id, and selecting the default removes it so the switch follows the default again; neither reloads. The Reload button (Restart on mobile) only appears while a saved option differs from the current one, and applies every saved change at once: a renderer reload on desktop, an app restart on mobile. A search bar and an All / Switched filter narrow the list. `resolveAppConfig` now returns `{ config, session }`: `session` is what it resolved the session from, which both stores pass to `createAppConfigMiddleware` with their reload. The middleware sets the new `appConfig` slice, saves the `selectAppConfigOption` and `resetAppConfigSwitch` actions to the storage and reloads on `reloadAppConfig`. `ConfigStorage` gains `remove`.
