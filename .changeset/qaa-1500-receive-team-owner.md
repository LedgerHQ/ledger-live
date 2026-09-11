---
"ledger-live-desktop-e2e-tests": patch
"ledger-live-mobile-e2e-tests": patch
---

Give the receive verify-address tests back to Coin-integration (QAA-1500)

`1d62665e5e9` moved `receive.address.spec.ts` off Wallet XP but carved XRP and
Tezos out to `Team.BST` — on desktop through two `teamOwner` overrides, on mobile
through `BST_VERIFY_ADDRESS_CURRENCIES`. Every test split from B2CQA-249 and
B2CQA-651 belongs to Coin-integration, so both carve-outs go, and with them the
now-dead `teamOwner?` field on `ReceiveTestCase`.

Ownership feeds Allure's `owner`/`parentSuite`/`feature` and the `team` CI
dropdown, which `e2e/tooling/filter/teamSpecs.mjs` resolves by grepping
`Team.<MEMBER>` per spec *file* — so a single `Team.BST` line pulled the whole
file into `team=bst`. `--list-teams` now reports `bst` at 9 desktop spec files
instead of 10 and 120 mobile instead of 130, with `coin-integration` unchanged.

Mobile also linked only the B2CQA-249-family key for eight of the ten currencies
while desktop linked both families. The missing B2CQA-651-family keys (2687, 2688,
2689, 2690, 2691, 2693, 2694, 2696) are added so both suites report the same Xray
tests.
