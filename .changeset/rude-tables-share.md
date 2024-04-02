---
"@ledgerhq/types-live": patch
"@ledgerhq/coin-algorand": patch
"@ledgerhq/coin-polkadot": patch
"@ledgerhq/coin-bitcoin": patch
"@ledgerhq/coin-evm": patch
"@actions/build-checks": patch
"@ledgerhq/native-modules-tools": patch
"ledger-live-desktop": patch
"live-mobile": patch
"@ledgerhq/live-common": patch
"@ledgerhq/ethereum-provider": patch
"@ledgerhq/dummy-wallet-app": patch
"@ledgerhq/wallet-api-exchange-module": patch
"@ledgerhq/coin-framework": patch
"@ledgerhq/live-nft-react": patch
"@ledgerhq/live-wallet": patch
"@ledgerhq/live-cli": patch
"@ledgerhq/live-env": patch
---

Drop technical Account#name and Account#starred fields and replace it with a new architecture: a wallet store that contains all user's data.
