---
"@ledgerhq/wallet-cli": minor
---

feat(wallet-cli): add agent-intent intents to list an agent's own intents

`agent-intent intents --profile <id>` lists the intents an enrolled profile proposed, most recent first, with `--status` filters, `--page-size` and `--cursor` pagination, using the profile's own key. The service scopes the list to that agent. Human output is a table with a next-page hint; `--output json` has stable fields, exact base-unit amounts as strings and `nextCursor`.
