---
"@ledgerhq/live-dmk-desktop": minor
"ledger-live-desktop": minor
---

Show the emulated device's screen in the desktop sidebar while the mock server transport is driving it, and let it be pressed.

The mock server proxies through to the Speculos instance backing a device, so its screen and inputs were already reachable — `@ledgerhq/device-mockserver-client` (bumped to a `develop` snapshot carrying `getScreenshot`, `pressButton` and `touchScreen`) now exposes them. A poller fetches PNG stills and sends input over the session token seeded at boot, so the panel drives the same device the transport is connected to.

The panel is docked at the foot of the sidebar, rendered only while an emulated device is connected, and collapsible to its header row — collapsing also stops the polling. Press and release are separate calls driven by pointer down and up, so a hold reaches the device as a hold, which Stax and Flex require to confirm. Each frame's own dimensions size the panel and map taps to device pixels, so a Nano's 128x64 strip and a Stax's 400x672 portrait both fit without a per-model size table. When no app is running there is no instance to capture, and the device's own record stands in.
