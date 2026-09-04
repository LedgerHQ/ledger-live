---
"ledger-live-mobile-e2e-tests": minor
"@ledgerhq/live-e2e-shared": minor
"live-mobile": minor
---

Split the Ledger Wallet Mobile Ledger Sync E2E test into five suites, one per Xray ticket, each
booting the app already a member of a freshly created trustchain and destroying it afterwards. The
mobile suite now shares the Ledger Sync CLI layer from `live-e2e-shared` instead of keeping a
near-verbatim copy, and a `TrustchainPage` asserts trustchain contents through the CLI. On the app
side this adds a Detox-only `importTrustchain` bridge message so a test can pre-seed the trustchain,
and testIDs on the `TinyCard` CTA and the manage-instances row so the synchronized instances list is
reachable from tests — the card's testID sat on a non-touchable container, so taps on it did nothing.

Also fixes `addAccountAtIndex`, which cleared the selection whenever exactly one account was
discovered: it tapped "deselect all" only for multiple accounts but tapped the account row
unconditionally, and a lone account arrives already selected, so Confirm was disabled and account
discovery timed out.
