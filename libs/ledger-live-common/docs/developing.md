# Developing on Ledger Live Common

To get things started, install the dependencies and build the project:

```
yarn          # install deps
yarn build    # build live-common...
yarn watch    # ...or watch to faster re-build
yarn test     # test exclusively live-common
```

## Testing your code

Ledger Live Common is the central library that many project consumes: **`cli/`**, **`mobile-test-app/`**, [Ledger Live Desktop](https://github.com/LedgerHQ/ledger-live-desktop), [Ledger Live Mobile](https://github.com/LedgerHQ/ledger-live-mobile). We have tools to quickly develop on it and test it on there.

**You can use `ledger-live` CLI to test your changes**, for this you will need to configure it, follow [Developing with `ledger-live` CLI](dev-with-cli.md)

## Release flow

to run **exclusively on master**

```
yarn publish
git push
git push --tags
```

you also likely want to update `tool` and release a new version as well (second commit).

## Adding cryptocurrencies

Please find instruction in [`src/data/cryptocurrencies.js`](src/data/cryptocurrencies.js).
