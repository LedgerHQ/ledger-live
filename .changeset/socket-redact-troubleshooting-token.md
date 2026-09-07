---
"@ledgerhq/live-common": patch
---

Keep a secure channel session token out of the network troubleshooting description.

`troubleshoot()` builds its scriptrunner check from `getEnv("BASE_SOCKET_URL")` and reports it as `technicalDescription: "connecting to <url>"`, which the troubleshooting UI renders. In mock server transport mode that env carries a `/secure-channel/<token>` url, so the description went through `redactSecureChannelToken` — the same sanitiser `createDeviceSocket` uses.
