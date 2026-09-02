---
"@ledgerhq/live-common": patch
---

Drop the mock-server branch from `createDeviceSocket`.

`createDeviceSocket` read `MOCK_SERVER_TRANSPORT` and, in that mode, lifted the session token out of the scriptrunner URL's `/secure-channel/<token>` path into a `token=` query param. That put mock-server knowledge in the platform-agnostic socket layer, and the query param was never read: the mock ScriptRunner parses the token from the path (`SecureChannelWebSocket`, `PATH_PREFIX = "/secure-channel/"`), so the rewrite was dead code.

`redactSecureChannelToken` stays — it is a plain sanitiser with no environment coupling, a no-op for URLs carrying no token, and it keeps a token out of traces and error metadata either way.
