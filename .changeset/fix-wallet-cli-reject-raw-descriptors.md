---
"@ledgerhq/wallet-cli": patch
---

Reject raw account descriptors as CLI arguments (use session labels from `account discover`) and reject extended private keys (xprv/yprv/zprv/tprv/uprv/vprv) in descriptor parsing.
