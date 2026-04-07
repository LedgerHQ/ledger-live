---
"@ledgerhq/live-common": patch
---

Lazy-load Alpaca coin API and signer modules on demand via `require()` instead of static imports to avoid evaluating unrelated coin stacks at startup
