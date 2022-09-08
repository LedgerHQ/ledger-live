/**
 *
 */
export type Unit = {
  // display name of a given unit (example: satoshi)
  name: string;
  // string to use when formatting the unit. like 'BTC' or 'USD'
  code: string;
  // number of digits after the '.'
  magnitude: number;
  // should it always print all digits even if they are 0 (usually: true for fiats, false for cryptos)
  showAllDigits?: boolean;
  // true if the code should prefix amount when formatting
  prefixCode?: boolean;
};

/**
 *
 */
type CurrencyCommon = {
  // display name of a currency
  name: string;
  // the ticker name in exchanges / countervalue apis (e.g. BTC).
  ticker: string;
  // all units of a currency (e.g. Bitcoin have bitcoin, mBTC, bit, satoshi)
  // by convention, [0] is the default and have "highest" magnitude
  units: Unit[];
  // a shorter version of code using the symbol of the currency. like Ƀ . not all cryptocurrencies have a symbol
  symbol?: string;
  // tells if countervalue need to be disabled (typically because colliding with other coins)
  disableCountervalue?: boolean;
  delisted?: boolean;
  // some countervalue will have a ticker alias
  countervalueTicker?: string;
};

/**
 *
 */
export type TokenCurrency = CurrencyCommon & {
  type: "TokenCurrency";
  id: string;
  ledgerSignature?: string;
  contractAddress: string;
  // the currency it belongs to. e.g. 'ethereum'
  parentCurrency: CryptoCurrency;
  // the type of token in the blockchain it belongs. e.g. 'erc20'
  tokenType: string;
  // indicates this is a compound token and it's "parent" erc20 have this id
  compoundFor?: string;
};

/**
 *
 */
export type FiatCurrency = CurrencyCommon & {
  type: "FiatCurrency";
};

/**
 *
 */
export type ExplorerView = {
  tx?: string;
  address?: string;
  token?: string;
};

/**
 *
 */
export type CryptoCurrency = CurrencyCommon & {
  type: "CryptoCurrency";
  // unique internal id of a crypto currency
  id: string;
  // define if a crypto is a fork from another coin. helps dealing with split/unsplit
  forkedFrom?: string;
  // name of the app as shown in the Manager
  managerAppName: string;
  // coin type according to slip44. THIS IS NOT GUARANTEED UNIQUE across currencies (e.g testnets,..)
  coinType: number;
  // the scheme name to use when formatting an URI (without the ':')
  scheme: string;
  // used for UI
  color: string;
  family: string;
  blockAvgTime?: number;
  // in seconds
  supportsSegwit?: boolean;
  supportsNativeSegwit?: boolean;
  // if defined this coin is a testnet for another crypto (id)};
  isTestnetFor?: string;
  // TODO later we could express union of types with mandatory bitcoinLikeInfo for "bitcoin" family...
  bitcoinLikeInfo?: {
    P2PKH: number;
    P2SH: number;
    XPUBVersion?: number;
    // FIXME optional as we miss some data to fill
    hasTimestamp?: boolean;
  };
  ethereumLikeInfo?: {
    chainId: number;
    networkId?: number;
    baseChain?: string;
    hardfork?: string;
    // used by evm light integration
    rpc?: string;
    // used by evm light integration
    explorer?: {
      uri: string;
      type: "etherscan" | "blockscout";
    };
  };
  explorerViews: ExplorerView[];
  terminated?: {
    link: string;
  };
  deviceTicker?: string;
};

/**
 *
 */
export type Currency = FiatCurrency | CryptoCurrency | TokenCurrency;
