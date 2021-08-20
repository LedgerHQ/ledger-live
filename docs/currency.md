# The Currency models

Ledger Live deals with different kinds of currencies and assets: fiat currencies, cryptocurrencies, and tokens.
They all share similar concepts but have specifics.

## The types

The types are defined in [types/currencies](../src/types/currencies.ts).

live-common exposes 3 different types: `CryptoCurrency`, `TokenCurrency` and `FiatCurrency`.
It also exposes a union type `Currency` that is either of these 3 types. _Make sure you use the correct type, sometimes you want the union type Currency, sometimes you are really in the context of a CryptoCurrency_.

To ease the differentiation of types, live-common's data also introduces a _discriminator field_, `.type`, which has the same name as the type.

### Common fields

Essentially all currencies share this common ground:

- `name: string`: the display name of a currency. For instance `"Bitcoin"` or `"Euro"`.
- `ticker: string`: the ticker name in exchanges and used for rates (for instance BTC or EUR).
- `units: Unit[]`: all available `Unit` of the currency (see below what is a Unit). by convention, [0] is the default and has the "highest" magnitude.
- `disableCountervalue?: boolean`: if available, this field expresses that we should assume there is not valid counter value for this coin. (because either we can't trade it or it's not available enough to assume enabling its value)
- `symbol?: string`: if available, it's a short symbol for the coin. _in practice it's currently not used and might be dropped._

#### Unit

```js
type Unit = {
  // display name of a given unit (example: satoshi)
  name: string,
  // string to use when formatting the unit. like 'BTC' or 'USD'
  code: string,
  // number of digits after the '.' in context of this unit.
  magnitude: number,
  // should it always print all digits even if they are 0 (usually: true for fiats, false for cryptos)
  showAllDigits?: boolean
};
```

A unit describes a given representation of a currency for humans. A currency can have many units, for instance, we can assume Euro have euros and cents. We can define Bitcoin to have: bitcoin, mBTC, bit, satoshi (but that's up to us really).

There are however two essential properties we must respect:

- the first unit (`[0]`) in an array of units is the **highest unit**, typically the default and commonly used unit (euro, bitcoin)
- the last unit must have a **magnitude of 0**: it is the smallest unit which in fine determines the magnitude of the coin (the most atomic unit representable in this currency) and drives integers representation.

Here is an example of Bitcoin units:

```js
[
  {
    name: "bitcoin",
    code: "BTC",
    magnitude: 8
  },
  {
    name: "mBTC",
    code: "mBTC",
    magnitude: 5
  },
  {
    name: "bit",
    code: "bit",
    magnitude: 2
  },
  {
    name: "satoshi",
    code: "sat",
    magnitude: 0
  }
];
```

The field `showAllDigits` is generally unset for all cryptocurrencies and set for fiat currencies to true (but there are exceptions). It forces a unit to display all digits even if it's all zeros.

We don't want showAllDigits for currencies because they generally have a lot of magnitudes, for instance, Ethereum has 18 which would turn `ETH 42.100000000000000000`. Instead, we want `ETH 42.1`.

At the opposite, it is commonly wanted that for popular fiats like EUR we will always display `EUR 42.10` and never `EUR 42.1`.

In live-common, our formatter is implemented by [`formatCurrencyUnit`](../src/currencies/formatCurrencyUnit.ts) which takes a BigNumber value and a Unit (and many other options available).

### CryptoCurrency specific fields

The crypto currency level introduces many fields that are exclusively specific to crypto currency.

```js
type CryptoCurrency = CurrencyCommon & {
  type: "CryptoCurrency",
  // unique internal id of a crypto currency
  id: string,
  // define if a crypto is a fork from another coin. helps dealing with split/unsplit
  forkedFrom?: string,
  // name of the app as shown in the Manager
  managerAppName: string,
  // coin type according to slip44. THIS IS NOT GUARANTEED UNIQUE across currencies (e.g testnets,..)
  coinType: number,
  // the scheme name to use when formatting an URI (without the ':')
  scheme: string,
  // used for UI
  color: string,
  family: string,
  blockAvgTime?: number, // in seconds
  supportsSegwit?: boolean,
  supportsNativeSegwit?: boolean,
  // if defined this coin is a testnet for another crypto (id)};
  isTestnetFor?: string,
  // TODO later we could express union of types with mandatory bitcoinLikeInfo for "bitcoin" family...
  bitcoinLikeInfo?: {
    P2PKH: number,
    P2SH: number
  },
  ethereumLikeInfo?: {
    chainId: number
  },
  explorerViews: ExplorerView[],
  terminated?: {
    link: string
  }
};
```

TO BE DETAILED MORE.

#### ExplorerView

```js
type ExplorerView = {
  tx?: string,
  address?: string,
  token?: string
};
```

### TokenCurrency specific fields

```js
type TokenCurrency = CurrencyCommon & {
  type: "TokenCurrency",
  id: string,
  ledgerSignature?: string,
  contractAddress: string,
  // the currency it belongs to. e.g. 'ethereum'
  parentCurrency: CryptoCurrency,
  // the type of token in the blockchain it belongs. e.g. 'erc20'
  tokenType: string
};
```

TO BE DETAILED MORE.

## The utility functions

live-common exposes a lot of utility functions to access and manipulate currencies.

TO DO.

### ..

### ..
