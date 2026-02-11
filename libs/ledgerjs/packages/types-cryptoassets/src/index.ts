import { CoinType } from "./slip44";

export type CryptoCurrencyId = string;

export type LedgerExplorerId =
  | "btc"
  | "btc_testnet"
  | "bch"
  | "btg"
  | "club"
  | "dash"
  | "dcr"
  | "dgb"
  | "doge"
  | "hsr"
  | "kmd"
  | "ltc"
  | "posw"
  | "qtum"
  | "strat"
  | "zec"
  | "zen"
  | "avax"
  | "eth"
  | "eth_sepolia"
  | "eth_hoodi"
  | "etc"
  | "matic"
  | "bnb";

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
  /**
   * tells if countervalue need to be disabled (typically because colliding with other coins)
   * @deprecated this field will soon be dropped. this is the API that drives this dynamically.
   */
  disableCountervalue?: boolean;
  // tells if countervalue need to be disabled (typically because colliding with other coins)
  delisted?: boolean;
  // keywords to be able to find currency from "obvious" terms
  keywords?: string[];
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
  stakePool?: string;
};

export type EthereumLikeInfo = {
  chainId: number;
};

export type BitcoinLikeInfo = {
  P2PKH: number;
  P2SH: number;
  XPUBVersion?: number;
};

/**
 *
 */
export type CryptoCurrency = CurrencyCommon & {
  type: "CryptoCurrency";
  // unique internal id of a crypto currency
  id: CryptoCurrencyId;
  // define if a crypto is a fork from another coin. helps dealing with split/unsplit
  forkedFrom?: string;
  // name of the app as shown in the Manager
  managerAppName: string;
  // coin type according to slip44. THIS IS NOT GUARANTEED UNIQUE across currencies (e.g testnets,..)
  coinType: CoinType;
  // the scheme name to use when formatting an URI (without the ':')
  scheme: string;
  // used for UI
  color: string;
  family: string;
  // the average time between 2 blocks, in seconds
  blockAvgTime?: number;
  supportsSegwit?: boolean;
  supportsNativeSegwit?: boolean;
  // if defined this coin is a testnet for another crypto (id)};
  isTestnetFor?: string;
  // TODO later we could express union of types with mandatory bitcoinLikeInfo for "bitcoin" family...
  bitcoinLikeInfo?: BitcoinLikeInfo;
  ethereumLikeInfo?: EthereumLikeInfo;
  explorerViews: ExplorerView[];
  terminated?: {
    link: string;
  };
  deviceTicker?: string;
  // Used to connect to the right endpoint url since it is different from currencyId and ticker
  explorerId?: LedgerExplorerId;
  tokenTypes?: string[];
};

/**
 *
 */
export type Currency = FiatCurrency | CryptoCurrency | TokenCurrency;

export type CryptoOrTokenCurrency = CryptoCurrency | TokenCurrency;

export { CoinType };
