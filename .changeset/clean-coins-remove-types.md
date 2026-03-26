---
"@ledgerhq/live-common": patch
"@ledgerhq/coin-evm": patch
"@ledgerhq/coin-aleo": patch
"@ledgerhq/coin-aptos": patch
"@ledgerhq/coin-canton": patch
"@ledgerhq/coin-celo": patch
"@ledgerhq/coin-concordium": patch
"@ledgerhq/coin-cosmos": patch
"@ledgerhq/coin-hedera": patch
"@ledgerhq/coin-polkadot": patch
"@ledgerhq/coin-stellar": patch
"@ledgerhq/coin-sui": patch
"@ledgerhq/coin-tezos": patch
"@ledgerhq/coin-tron": patch
"@ledgerhq/coin-vechain": patch
"@ledgerhq/coin-xrp": patch
"@ledgerhq/coin-module-boilerplate": patch
"@ledgerhq/coin-tester-evm": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

Remove @ledgerhq/types-cryptoassets dependency from coin-framework by replacing CryptoCurrency parameters with currencyId strings in CoinConfig and getCurrencyConfiguration
