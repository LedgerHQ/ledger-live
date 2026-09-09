---
"ledger-live-desktop": patch
---

Deny screen capture and device access to Live App webviews

No `setPermissionRequestHandler` was installed anywhere in the app, and Electron grants permission requests by default when none is set. Any script running in a Live App or dApp `<webview>` could therefore call `getUserMedia({video:{mandatory:{chromeMediaSource:"desktop"}}})` and receive a live stream of the user's entire desktop with no prompt, exposing wallet balances, accounts and addresses along with everything else on screen.

The `setPermissionCheckHandler` on the main window session did not cover this: Chromium only consults the check handler before falling through to the request path, and the check handler was attached to a single window rather than to the sessions the guests actually use. Live Apps shared the default session with the host renderer whenever their manifest set no `cacheBustingId`, which was every manifest in the catalog.

Every session now carries a deny-by-default permission policy, applied per session and keyed on whether the caller is a `<webview>` guest:

- screen capture is refused for guests and host alike, via `display-capture` and via the `media` permission whose `mediaTypes` identify a non-device capture
- the camera and microphone still work, so `wallet-connect-live-app` can keep scanning QR codes and fiat ramp providers can keep running identity verification inside the webview
- `getDisplayMedia` is refused explicitly rather than left to an Electron default
- guest documents receive a `Permissions-Policy: display-capture=()` header alongside the existing CSP
- the `hid` permission check and the `select-hid-device` guard now identify the caller, so a Live App can no longer reach the Ledger device through the session it shares with the renderer

Live Apps no longer run in the host's session at all. A manifest without a `cacheBustingId` used to leave the `partition` attribute unset, putting the guest in the renderer's own session, where `setDevicePermissionHandler` grants any Ledger HID device: `navigator.hid.getDevices()` and `HIDDevice.open()` consult that handler without passing through the `hid` check or `select-hid-device`, so neither new guard applied to them. Those apps now share a `persist:live-app-shared` partition, and apps pinning a `cacheBustingId` keep their own, under the same name as before so the partitions already on disk stay reachable.

Because Live App data now lives outside the default session, Settings clears it explicitly: "Clear cache" drops each partition's HTTP cache and "Reset" drops their cookies and storage, including partitions left on disk by apps not opened since launch. Reset previously removed only the app database, so third-party tokens held by a Live App survived it.

Two smaller fixes: the guest `Permissions-Policy` header is merged into the one the Live App returns instead of replacing it, which would have dropped a fiat ramp's own `camera` delegation to its cross-origin KYC iframe; and a `select-hid-device` request whose frame has gone away is denied rather than left to throw, which would have hung `navigator.hid.requestDevice()` forever.
