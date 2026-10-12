---
"ledger-live-mobile-e2e-tests": patch
"ledger-live-desktop-e2e-tests": patch
"@ledgerhq/live-e2e-shared": patch
---

Add mobile Borrow E2E coverage for full repay (B2CQA-6073) and withdraw collateral (B2CQA-6080), closing the LLD/LLM parity gap on those keys (QAA-1477). Open loan, repay and withdraw now share one spec, and each resets the ERC-20 allowance its approval step needs, with the spender resolved from the partner's own action.

The borrow driver now enables blind signing on touch devices, and a partner 5xx is retried only on read endpoints, so a lost response can no longer leave a second action behind. It pads gas limits so a call no longer runs out of gas when state moves before inclusion. Mobile and desktop now wait for each on-chain step to land before starting the next, so the app never reuses a nonce still in flight, and each test waits for the partner to index its outcome before cleanup touches the account. A detox retry also skips the describe blocks it has nothing to rerun instead of repeating their on-chain setup. On desktop, waiting for the device validation screen now gets the same budget as the sign modal, since the partner prepares each transaction server-side.
