---
"@domain/entity-account-descriptor": minor
"@ledgerhq/wallet-cli": minor
"@ledgerhq/live-common": patch
---

feat(account-descriptor): identify the network by its CAL network_id

The descriptor becomes `account:2:<type>:<network_id>:<key>:<path>` and the entity only reads version 2. wallet-cli upgrades the version 1 descriptors it persisted (`session.yaml`) and reports `network` as the network id (`ethereum`, `bitcoin_testnet`).
