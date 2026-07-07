---
"@ledgerhq/coin-celo": minor
---

celo: fix revoke vote fee not being calculated. The revoke fee estimation now reuses buildTransaction so it uses the correct lesser/greater neighbors and revoke value, and falls back to a minimum gas estimate instead of returning a 0 fee on estimation failure (which left the Continue button disabled). Also matches the validator group case-insensitively in getVote.

celo: fix revoke reverting with "Bad index" for accounts that voted for multiple validator groups. buildRevokeTx now resolves the group's real position in getGroupsVotedForByAccount (keyed by the vote signer) and passes it as the Election contract's on-chain index argument, instead of a hard-coded 0. Revoking a non-first group previously reverted at estimateGas/sign time.
