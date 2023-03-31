This document allows to track, explain and maintain the dependencies we have defined in package.json.

You can see at any point in time what libraries are upgradable using:

```
yarn upgrade-interactive -i --latest
```

### Direct Dependencies

| library name (what).                        | description of its usage (why)                                    | ideal frequency of update (when) / status                            |
| ------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| @celo/contractkit                           | Celo coin integration                                             | monthly                                                              |
| @celo/wallet-base                           | Celo coin integration                                             | monthly                                                              |
| @celo/wallet-ledger                         | Celo coin integration                                             | monthly                                                              |
| @cosmjs/amino                               | Cosmos coin integration                                           | monthly                                                              |
| @cosmjs/crypto                              | Cosmos coin integration                                           | monthly                                                              |
| @cosmjs/ledger-amino                        | Osmosis coin integration                                          | TBD, planning to remove soon                                         |
| @cosmjs/proto-signing                       | Cosmos coin integration                                           | monthly                                                              |
| @cosmjs/stargate                            | Cosmos coin integration                                           | monthly                                                              |
| @crypto-org-chain/chain-jslib               | Cronos coin integration                                           | monthly                                                              |
| @keplr-wallet/cosmos                        | Osmosis coin integration                                          | TBD, planning to remove                                              |
| @ethereumjs/common                          | Ethereum coin integration                                         | monthly                                                              |
| @ethereumjs/tx                              | Ethereum coin integration                                         | monthly                                                              |
| @ledgerhq/compressjs                        | used for LiveQR feature                                           | stable                                                               |
| @ledgerhq/cryptoassets                      | crypto currencies and tokens                                      | weekly                                                               |
| @ledgerhq/devices                           | devices data                                                      | weekly                                                               |
| @ledgerhq/errors                            | errors defintion                                                  | weekly                                                               |
| @ledgerhq/hw-app-algorand                   | Algorand coin integration                                         | weekly                                                               |
| @ledgerhq/hw-app-btc                        | Bitcoin coin integration                                          | weekly                                                               |
| @ledgerhq/hw-app-cosmos                     | Cosmos coin integration                                           | weekly                                                               |
| @ledgerhq/hw-app-eth                        | Ethereum coin integration                                         | weekly                                                               |
| @ledgerhq/hw-app-polkadot                   | Polkadot coin integration                                         | weekly                                                               |
| @ledgerhq/hw-app-solana                     | Solana coin integration                                           | weekly                                                               |
| @ledgerhq/hw-app-str                        | Ethereum coin integration                                         | weekly                                                               |
| @ledgerhq/hw-app-tezos                      | Tezos coin integration                                            | weekly                                                               |
| @ledgerhq/hw-app-trx                        | TRON coin integration                                             | weekly                                                               |
| @ledgerhq/hw-app-xrp                        | XRP coin integration                                              | weekly                                                               |
| @ledgerhq/hw-transport                      | device communication                                              | weekly                                                               |
| @ledgerhq/hw-transport-mocker               | used by tests                                                     | weekly                                                               |
| @ledgerhq/hw-transport-node-speculos        | used by bot tests                                                 | weekly                                                               |
| @ledgerhq/json-bignumber                    | workaround for Ledger explorers who don't give String in some API | stable                                                               |
| @ledgerhq/live-app-sdk                      | utils for live apps feature                                       | ???                                                                  |
| @ledgerhq/logs                              | logs                                                              | weekly                                                               |
| @polkadot/types                             | Polkadot coin integration                                         | monthly                                                              |
| @polkadot/types-known                       | Polkadot coin integration                                         | monthly                                                              |
| @polkadot/util                              | Polkadot coin integration                                         | monthly                                                              |
| @polkadot/util-crypto                       | Polkadot coin integration                                         | monthly                                                              |
| @polkadot/wasm-crypto                       | Polkadot coin integration                                         | **BLOCKED BY LLM (ticket missing)**                                  |
| @solana/spl-token                           | Solana coin integration                                           | monthly                                                              |
| @solana/web3.js                             | Solana coin integration                                           | **BLOCKED BY LLM because of BigInt in RN (ticket missing)**          |
| @taquito/ledger-signer                      | Tezos coin integration                                            | monthly                                                              |
| @taquito/taquito                            | Tezos coin integration                                            | monthly                                                              |
| @taquito/utils                              | Tezos coin integration                                            | monthly                                                              |
| @types/bchaddrjs                            | Bitcoin coin integration                                          | monthly                                                              |
| @types/bs58check                            | Bitcoin coin integration                                          | monthly                                                              |
| @walletconnect/client                       | Wallet connect feature                                            | monthly                                                              |
| @xstate/react                               | used for some components                                          | TBD DEPRECATE?                                                       |
| @zondax/ledger-filecoin                     | Filecoin coin integration                                         | monthly                                                              |
| algosdk                                     | Algorand coin integration                                         | monthly                                                              |
| async                                       | ???                                                               | UNCLEAR IF USED                                                      |
| axios                                       | network                                                           | monthly                                                              |
| axios-retry                                 | network                                                           | monthly                                                              |
| base32-decode                               | Filecoin coin integration                                         | monthly                                                              |
| bchaddrjs                                   | Bitcoin coin integration                                          | monthly                                                              |
| bech32                                      | Bitcoin coin integration                                          | BLOCKED? TBD                                                         |
| bignumber.js                                | many parts involving amounts                                      | monthly                                                              |
| bip32                                       | coin integrations                                                 | monthly                                                              |
| bip32-path                                  | coin integrations                                                 | monthly                                                              |
| bip39                                       | needed for bot                                                    | monthly                                                              |
| bitcoinjs-lib                               | Bitcoin coin integration                                          | **ticket missing**: apparently blocking LLM                          |
| blake-hash                                  | Bitcoin coin integration                                          | monthly                                                              |
| bs58                                        | Bitcoin coin integration                                          | monthly                                                              |
| bs58check                                   | Bitcoin coin integration                                          | monthly                                                              |
| buffer                                      | many parts for bytes ops                                          | monthly                                                              |
| cashaddrjs                                  | Bitcoin coin integration                                          | monthly                                                              |
| cbor                                        | Filecoin coin integration                                         | monthly                                                              |
| coininfo                                    | Bitcoin coin integration                                          | monthly                                                              |
| crypto-js                                   | NEO coin integration                                              | monthly                                                              |
| eip55                                       | Ethereum coin integration                                         | monthly                                                              |
| eth-sig-util                                | Ethereum coin integration                                         | monthly                                                              |
| ethereumjs-abi                              | Ethereum coin integration                                         | monthly                                                              |
| ethereumjs-util                             | Ethereum coin integration                                         | monthly                                                              |
| expect                                      | Tests                                                             | monthly                                                              |
| generic-pool                                | Bitcoin coin integration                                          | monthly                                                              |
| invariant                                   | generic helper                                                    | monthly                                                              |
| isomorphic-ws                               | WebSocket helper                                                  | monthly                                                              |
| json-rpc-2.0                                | Ethereum coin integration                                         | monthly                                                              |
| leb128                                      | Filecoin coin integration                                         | monthly                                                              |
| lodash                                      | generic helper                                                    | monthly                                                              |
| long                                        | Osmosis coin integration                                          | monthly                                                              |
| lru-cache                                   | generic helper                                                    | monthly                                                              |
| numeral                                     | for very concise amount display (on graph)                        | monthly – **TBD if can be dropped**                                  |
| object-hash                                 | Solana coin integration                                           | monthly                                                              |
| performance-now                             | bot                                                               | monthly – may not strongly need                                      |
| prando                                      | account mocks                                                     | stable – try not to upgrade to not change the mock data too often    |
| redux                                       | general react helper                                              | monthly                                                              |
| reselect                                    | general react helper                                              | monthly                                                              |
| ripemd160                                   | Bitcoin coin integration                                          | monthly                                                              |
| ripple-binary-codec                         | XRP coin integration                                              | monthly                                                              |
| ripple-bs58check                            | XRP coin integration                                              | monthly                                                              |
| ripple-lib                                  | XRP coin integration                                              | monthly                                                              |
| rlp                                         | Ethereum coin integration                                         | monthly                                                              |
| rxjs                                        | generic helper                                                    | BLOCKED by issue revealed when trying to upgrade. **ticket missing** |
| rxjs-compat                                 | generic helper                                                    | BLOCKED by issue revealed when trying to upgrade. **ticket missing** |
| secp256k1                                   | Bitcoin coin integration                                          | monthly                                                              |
| semver                                      | generic helper                                                    | monthly                                                              |
| sha.js                                      | generic helper for crypto                                         | monthly                                                              |
| stellar-sdk                                 | Stellar coin integration                                          | monthly                                                              |
| triple-beam                                 | logs                                                              | monthly                                                              |
| winston                                     | logs                                                              | monthly                                                              |
| xstate                                      | generic helper for React                                          | **TBD why it's needed.**                                             |
| zcash-bitcore-lib                           | Bitcoin coin integration                                          | monthly                                                              |
| varuint-bitcoin                             | Bitcoin coin integration                                          | monthly                                                              |
| @stricahq/typhonjs                          | Cardano coin integration                                          | monthly                                                              |
| @stricahq/bip32ed25519                      | Cardano coin integration                                          | stable                                                               |
| @cardano-foundation/ledgerjs-hw-app-cardano | Cardano coin integration                                          | stable                                                               |
