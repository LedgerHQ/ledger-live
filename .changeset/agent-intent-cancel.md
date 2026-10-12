---
"@ledgerhq/wallet-cli": minor
---

feat(wallet-cli): add agent-intent cancel to withdraw an intent before the user signs it

`agent-intent cancel --profile <id> --intent <id>` cancels a `created` or `crafted` intent, after confirmation or with `--yes`. Other known states are refused; a state this version doesn't know is left to the service.
