---
"@ledgerhq/wallet-cli": minor
---

Name the host a failed network request could not reach, with a hint to allow it in a sandbox, or saying it timed out or its TLS certificate is not trusted (`host` and `hint` in JSON errors), give Earn HTTP failures the `EarnApiHttpError` code and `http_status`, and read a proxy's refused tunnel on Bun 1.4.4 as its HTTP status
