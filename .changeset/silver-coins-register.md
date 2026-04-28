---
"@ledgerhq/live-common": minor
---

Add loadSigner to CoinModuleLoader and expose loadSignerForFamily from registry; register Alpaca signers in loaders for evm, solana, stellar, tezos, and xrp; refactor getSigner to delegate to the registry instead of a hardcoded switch
