---
"@features/platform-style": minor
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/web-tools": minor
---

`StyleProvider` moves to platform entries: `@features/platform-style/web` and `@features/platform-style/native` each export `StyleProvider` and `StyleProviderProps`, and `@features/platform-style` no longer exports it. The package imports carry no platform suffix and its tests run in a web and a native jest project.
