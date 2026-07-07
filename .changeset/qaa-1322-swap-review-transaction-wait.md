---
"@ledgerhq/live-common": minor
---

fix(e2e): give swap flows a larger "Review transaction" device-wait budget (~120s) to reduce flaky "Review transaction not found" timeouts on nanoSP under heavy parallel Speculos load (QAA-1322)
