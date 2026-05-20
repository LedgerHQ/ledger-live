---
"live-mobile": minor
"@ledgerhq/live-dmk-shared": minor
---

Improve console log readability when debugging via Chrome / React Native DevTools: mobile's `ConsoleLogger` now uses `console.groupCollapsed` with raw objects instead of stringifying everything to JSON, and the DMK logger emits a clearer `DMK[tag]` log type (with backward-compatible filtering in the logs viewer) instead of the generic `live-dmk-logger`.
