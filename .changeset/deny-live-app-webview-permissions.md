---
"ledger-live-desktop": patch
---

Deny screen capture and device access to Live App webviews

No `setPermissionRequestHandler` was installed anywhere in the app, and Electron grants permission requests by default when none is set. Any script running in a Live App or dApp `<webview>` could therefore call `getUserMedia({video:{mandatory:{chromeMediaSource:"desktop"}}})` and receive a live stream of the user's entire desktop with no prompt, exposing wallet balances, accounts and addresses along with everything else on screen.

The `setPermissionCheckHandler` on the main window session did not cover this: Chromium only consults the check handler before falling through to the request path, and the check handler was attached to a single window rather than to the sessions the guests actually use. Live Apps share the default session with the host renderer whenever their manifest sets no `cacheBustingId`, which is every manifest in the catalog today.

Every session now carries a deny-by-default permission policy, applied per session and keyed on whether the caller is a `<webview>` guest:

- screen capture is refused for guests and host alike, via `display-capture` and via the `media` permission whose `mediaTypes` identify a non-device capture
- the camera and microphone still work, so `wallet-connect-live-app` can keep scanning QR codes and fiat ramp providers can keep running identity verification inside the webview
- `getDisplayMedia` is refused explicitly rather than left to an Electron default
- guest documents receive a `Permissions-Policy: display-capture=()` header alongside the existing CSP
- the `hid` permission check and the `select-hid-device` guard now identify the caller, so a Live App can no longer reach the Ledger device through the session it shares with the renderer
