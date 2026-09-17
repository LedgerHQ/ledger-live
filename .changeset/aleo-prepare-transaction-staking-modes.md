---
"@ledgerhq/coin-aleo": minor
---

feat: prepare bond_public, unbond_public and claim_unbond_public transactions — the two missing
bridge transaction mode arms and their raw form, per-mode fee lookup, per-mode amount resolution,
and the withdrawal and recipient addresses pinned to the account's own address so a caller cannot
choose them. Because an unbond and a claim are therefore self-referential, a self-send is now
allowed for those two modes while staying rejected for every transfer mode. Also fixes a bond being
relabelled as a public transfer, and so priced at the transfer fee, on its way through the bridge.
No user-reachable behaviour yet: the staking flows remain behind the disabled staking configuration
flag.
