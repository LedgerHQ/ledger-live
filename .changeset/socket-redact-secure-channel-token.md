---
"@ledgerhq/live-common": patch
---

Keep a secure channel session token out of `createDeviceSocket` traces.

A scriptrunner URL can carry a session token, in a `/secure-channel/<token>` path segment or a `token=` query param, and `createDeviceSocket` put the raw URL in every trace and in the metadata of `WebsocketConnectionError` and `DeviceSocketFail` — all of which reach monitoring. Everything traced or attached to an error now goes through `redactSecureChannelToken`, a plain sanitiser with no environment coupling and a no-op for URLs that carry no token.
