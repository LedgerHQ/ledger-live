---
"@features/flow-contacts-add-address": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

Remove unused PrefillAddAddressFlowRoot and the shared prefill listener store. Send now owns the prefilled add-address session via startWithPrefilled.
