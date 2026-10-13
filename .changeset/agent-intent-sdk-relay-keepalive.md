---
"@ledgerhq/wallet-cli": patch
---

fix(wallet-cli): keep agent-intent enrollment sessions open past 5 minutes

Re-vendor `@ledgerhq/agent-intent-sdk` from `main` `00d6830`. `agent-intent enroll` and `recover` no longer lose the session when the user takes more than 5 minutes to open the link or approve on the device.
