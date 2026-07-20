---
"@ledgerhq/live-e2e-shared": minor
---

fix(e2e): serialize token approve/revoke broadcasts per EOA and retry transient nonce failures

Several swap E2E specs broadcast real ERC-20 approve/revoke from the same shared ETH index-0 EOA in parallel (`fullyParallel`), causing intermittent `replacement transaction underpriced` / `not confirmed within` failures (a nonce race on the shared account). Adds a cross-worker filesystem lock keyed by the parent EOA in `approveTokenCommand`/`revokeTokenCommand` so only one broadcast per EOA runs at a time across Playwright workers, plus a retry backstop for transient underpriced/nonce/not-confirmed errors that re-drives the device prompt on each attempt. (QAA-1323)