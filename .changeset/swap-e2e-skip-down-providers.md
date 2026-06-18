---
"@ledgerhq/live-common": patch
---

e2e: skip swap providers that are down for the pair before the weekly rotating-provider pick, so the token-approval and reapproval swap E2E (desktop + mobile) no longer fail when rotation lands on an unavailable provider (QAA-1278).