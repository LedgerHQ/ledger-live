---
"@ledgerhq/live-dmk-speculos": patch
---

Fix flaky e2e failures where account discovery failed with a DMK `GeneralDmkError` ("Network Error", Axios `ERR_NETWORK`). The Speculos proxy closes idle keep-alive sockets after ~60s, so a cached DMK session reused after a longer idle gap (e.g. a test whose first device interaction comes well after the previous one) failed on its first APDU. The transport now proactively reconnects when a cached session has been idle past a safe threshold, and `ERR_NETWORK` / "Network Error" are classified as retryable transient HTTP failures.
