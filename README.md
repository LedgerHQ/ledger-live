# ledger-wallet-common

Common ground for the Ledger Live apps

## Install

```
yarn add @ledgerhq/live-common
```

## Development

```
yarn          # install deps
yarn build    # build live-common...
yarn watch    # ...or watch to faster re-build
yarn test     # test exclusively live-common
```

### `tool` folder is a `ledger-live` command-line

To run it for development and have the latest sourcecode running we can link the @ledgerhq/live-common libarary with a symlink.
You likely want to run `yarn watch` in a terminal and do this in another terminal (from top level):

```
yarn link     # link live-common
cd tool/
yarn
yarn link @ledgerhq/live-common
yarn link    # will make ledger-live CLI available
yarn watch   # incremental build as well
```

Assuming that `yarn global bin` is in your `$PATH`,

You can run:

```
ledger-live
```

and it will always use your latest sourcecode.

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
