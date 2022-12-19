---
"ledger-live-desktop": minor
---

Electron was upgraded from 15 to 21 as well as "electron-builder"

- that means we have a new bump of the nodejs version for native module too. So all native library impacted (coins, usb,..)
- that means we have a new Chromium version. So the UI is impacted. Screenshots have changed due to this.

In a breaking change in Electron 18 the nativeWindowOpen web preference (used [here](https://github.com/LedgerHQ/ledger-live/blob/ff2d747c1a3aa6bc779d1987c0f2a5e0369c2d72/apps/ledger-live-desktop/src/renderer/components/WebPlatformPlayer/index.tsx#L416)) have [been removed](https://www.electronjs.org/blog/electron-18-0#removed-nativewindowopen) (cf. [this PR](https://github.com/electron/electron/pull/29405))

Now, Ledger live does not seem to receive (and handle) new-window events when a live-apps wants to open a new window (regularly used throughout Live Apps to open external contextual info like redirect to Twitter account, open ToS page, etc…)

`webview` are deprecated and not formerly integrated / maintained in electron.
updating electron broke previous handleding of new window opened from a `webview`

use `setWindowOpenHandler` on the `webview` webContents to handle opening new window.
cf. https://github.com/electron/electron/issues/31117#issuecomment-958733861

also, there seem to be issues between `webview` and React
cf. https://github.com/electron/electron/issues/6046
