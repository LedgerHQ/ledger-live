---
"@domain/entity-account-descriptor": minor
"@ledgerhq/wallet-cli": major
"@ledgerhq/live-common": minor
---

feat(account-descriptor): identify the network by its CAL network_id

The descriptor becomes `account:2:<type>:<network_id>:<key>:<path>` and the entity only reads version 2.

wallet-cli, breaking:

- The upgrade is one-way: `session.yaml` is rewritten to version 2 on the next write (e.g. `account discover`), and an older wallet-cli can no longer read it. Don't roll back, pin an older install or run two versions on the same session.
- `network` in the JSON envelope and in analytics events is now the network id (`ethereum`, `bitcoin_testnet`), no longer `<name>:<env>` (`ethereum:main`).
