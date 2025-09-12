<img src="https://user-images.githubusercontent.com/4631227/191834116-59cf590e-25cc-4956-ae5c-812ea464f324.png" height="100" />

## @ledgerhq/cryptoassets

Ledger's material for crypto currencies, tokens and fiats. Also includes signatures required by Nano devices for these tokens.

**DO NOT EDIT because this library is generated.**

## Usage

There are two modes of usage of this library.

*   The all-in way: you want to have all the data available (ERC20 token loaded,...). To do this, you simply import `@ledgerhq/cryptoassets`
*   The custom way: you can import individual data piece from `@ledgerhq/cryptoassets/data/*`. For instance, importing the ERC20 signatures can be done with `@ledgerhq/cryptoassets/data/erc20-signatures` sub module.

## Importing CAL tokens in cryptoassets data

```bash
pnpm import:cal-tokens
```
