---
"@ledgerhq/coin-stacks": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Include the Stacks memo in sent transactions on the generic coin framework. The memo fields now also set `memoType`/`memoValue`, which the generic bridge turns into the intent's memo, and coin-stacks writes it into STX and SIP-010 transfers and rejects one longer than 34 bytes (LIVE-39478).
