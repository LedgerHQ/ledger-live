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
"@ledgerhq/coin-multiversx": minor
"@ledgerhq/coin-near": minor
"@ledgerhq/coin-polkadot": minor
"@ledgerhq/coin-solana": minor
"@ledgerhq/coin-stacks": minor
"@ledgerhq/coin-stellar": minor
"@ledgerhq/coin-sui": minor
"@ledgerhq/coin-tezos": minor
"@ledgerhq/coin-ton": minor
"@ledgerhq/coin-tron": minor
"@ledgerhq/coin-vechain": minor
"@ledgerhq/coin-xrp": minor
"@ledgerhq/zcash-shielded": minor
---

chore(coin-modules): add oxfmt with shared config (Prettier parity)

- Add libs/coin-modules/.oxfmtrc.json aligned with root .prettierrc and desktop/mobile oxfmt
- Add format, format:check, and run oxfmt before oxlint in lint:fix; add oxfmt devDependency
- Remove coin-ton prettier script; turbo format/format:check tasks
- Initial oxfmt pass on src
