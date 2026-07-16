---
"@ledgerhq/coin-aleo": minor
"@ledgerhq/coin-algorand": minor
"@ledgerhq/coin-aptos": minor
"@ledgerhq/coin-bitcoin": minor
"@ledgerhq/coin-canton": minor
"@ledgerhq/coin-cardano": minor
"@ledgerhq/coin-casper": minor
"@ledgerhq/coin-celo": minor
"@ledgerhq/coin-concordium": minor
"@ledgerhq/coin-cosmos": minor
"@ledgerhq/coin-evm": minor
"@ledgerhq/coin-filecoin": minor
"@ledgerhq/coin-hedera": minor
"@ledgerhq/coin-icon": minor
"@ledgerhq/coin-internet_computer": minor
"@ledgerhq/coin-kaspa": minor
"@ledgerhq/coin-mina": minor
"@ledgerhq/coin-module-boilerplate": minor
"@ledgerhq/coin-modules-monitoring": minor
"@ledgerhq/coin-multiversx": minor
"@ledgerhq/coin-near": minor
"@ledgerhq/coin-polkadot": minor
"@ledgerhq/coin-solana": minor
"@ledgerhq/coin-stacks": minor
"@ledgerhq/coin-sui": minor
"@ledgerhq/coin-tester-bitcoin": minor
"@ledgerhq/coin-tester-cardano": minor
"@ledgerhq/coin-tester-cosmos": minor
"@ledgerhq/coin-tester-evm": minor
"@ledgerhq/coin-tester-multiversx": minor
"@ledgerhq/coin-tester-polkadot": minor
"@ledgerhq/coin-tester-solana": minor
"@ledgerhq/coin-tester-stellar": minor
"@ledgerhq/coin-tester-tezos": minor
"@ledgerhq/coin-tester-tron": minor
"@ledgerhq/coin-tester-xrp": minor
"@ledgerhq/coin-ton": minor
"@ledgerhq/coin-tron": minor
"@ledgerhq/coin-vechain": minor
---

Consume currency accessors and currency types from `@ledgerhq/ledger-wallet-framework` instead of `@ledgerhq/cryptoassets`/`@ledgerhq/types-cryptoassets`. Value accessors now resolve through the framework's injected `CurrenciesResolver`; `CryptoCurrency`/`TokenCurrency`/`Unit`/`ExplorerView` types are imported from the framework.
