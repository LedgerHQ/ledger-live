# `hw-getAddress.ts`
Functions necessary to retrieve addresses of a signer. 

## Methods

#### default
Uses the signer (a Ledger Nano here) and derivates its [`BIP-39`](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) seed with the `m/44'/60'/0'/x` [`BIP-44` derivation path](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki) where `x` is the address index. 