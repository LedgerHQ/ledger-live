---
"@ledgerhq/wallet-cli": minor
---

feat(wallet-cli): add agent-intent send to propose EVM payments for human review

`agent-intent send` lets an enrolled Agent Intent profile propose a native ETH or ERC-20 transfer on
Ethereum mainnet. It signs the proposal with the profile's key, submits it to the Agent Intent
service and prints the frontend review link; it never signs or broadcasts a transaction and needs
no device. Amounts are converted to exact base units (never rounded), addresses are checked against
EIP-55, and `--dry-run` validates a proposal without submitting it.
