---
"@ledgerhq/wallet-cli": minor
---

The `wallet-cli-usage` skill asks the human once per conversation before running commands outside the host sandbox, and enrolls Agent Intent with `app.agents.ledger.com` or, on request, with the staging app through the opt-in `references/staging.md`, whose fixed URL is the only `--app-url` it passes. Its copy published to LedgerHQ/agent-skills pins wallet-cli to its exact version: with a newer wallet-cli the agent follows the skill embedded in that binary, and with an older one or none it installs the pinned version once the human agrees
