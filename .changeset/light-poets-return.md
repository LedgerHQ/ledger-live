---
"@ledgerhq/coin-hedera": minor
---

Bump @hashgraph/sdk from 2.78.0 to 2.81.0. The SDK aliases cryptography to @hashgraph/cryptography 1.17.0, which still pins @noble/curves 1.8.1, so the old noble copy stays. Retarget the proto console.log patch to @hashgraph/proto 2.26.0-beta.3.
