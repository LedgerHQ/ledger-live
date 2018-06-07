# ledger-wallet-common

Common ground for the Ledger Wallet apps

## Install

```
yarn add @ledgerhq/live-common
```

## Development

```
# install deps && flow deps
yarn
yarn flow-typed

# code check
yarn prettier
yarn lint
yarn flow
yarn test

# build documentation
yarn documentation

# build lib
yarn build

# rebuild on every change
yarn watch

# publish new version
yarn publish
```

## Process on Adding a new coin

Please find instruction in [`src/data/cryptocurrencies.js`](src/data/cryptocurrencies.js).
