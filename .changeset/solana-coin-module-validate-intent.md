---
"@ledgerhq/coin-solana": minor
---

Preparation for running Solana on the generic coin framework, with no effect on the app yet: the family is still served by its legacy bridge.

The coin module validates an intent the way the legacy bridge validated a transaction, so the send and staking screens will refuse what the chain would refuse: a recipient that is not funded or sits off the ed25519 curve, a frozen or non-existent token account, a recipient that is the sender's own associated token account, an amount that leaves too little for the rent or for a later unstake, a memo that is too long, and a stake account in a state the requested command cannot act on. Opening a recipient's associated token account is reported as a warning with its rent, rather than rejected.

Restored alongside, each a check the legacy bridge had: a stake split requires an amount, an approval or a revocation is refused against a frozen or uninitialized token account, a Token-2022 transfer fee counts against the token balance rather than only the recipient's share, a token authority command is paid from the actually spendable balance rather than one that still counts the rent and the unstake reserve, a recipient whose derived token account address holds lamports without being a token account is refused instead of reaching the chain, opening a token account that already exists is refused rather than built on a non-idempotent instruction, approving or revoking against an account that does not exist is refused, an approval whose delegate is the sender's own token account is refused, and staking the maximum when nothing would be left reports an insufficient balance.
