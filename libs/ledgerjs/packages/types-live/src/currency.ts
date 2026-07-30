// Currency types owned locally by types-live. They cannot be sourced from the wallet
// framework's copy: the framework already depends on this package, which would be a cycle.
// New code should prefer the @domain/entity-currency-* packages.

/**
 * @deprecated Opaque Ledger-explorer endpoint id, kept only for backward compatibility.
 * Loosened from a fixed union to `string`; the explorer-id concept is being phased out.
 */
export type LedgerExplorerId = string;

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
  id: any;
  ledgerSignature?: string;
  contractAddress: string;
  // id of the currency it belongs to. e.g. 'ethereum'
  parentCurrencyId: any;
  // the type of token in the blockchain it belongs. e.g. 'erc20'
  tokenType: string;
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
  id: any;
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
  deviceTicker?: string;
  /**
   * Used to connect to the right endpoint url since it is different from currencyId and ticker.
   * @deprecated Kept only for backward compatibility; the explorer-id concept is being phased out.
   */
  explorerId?: LedgerExplorerId;
  tokenTypes?: string[];
};

export type CryptoOrTokenCurrency = CryptoCurrency | TokenCurrency;

// As defined here: https://github.com/satoshilabs/slips/blob/master/slip-0044.md
export enum CoinType {
  AE = 457,
  AION = 425,
  AKA = 200625,
  ALEO = 683,
  ALGO = 283,
  APTOS = 637,
  ATOM = 118,
  ARK = 111,
  ATH = 1620,
  BANANO = 198,
  BITTENSOR = 1005,
  BTC = 0,
  BTC_CASH = 145,
  BTC_GOLD = 156,
  BTC_PRIVATE = 183,
  BTC_TESTNET = 1,
  CALLISTO = 820,
  CANTON_NETWORK = 6767,
  CARDANO = 1815,
  CELO = 52752,
  CONCORDIUM = 919,
  CRYPTO_ORG = 394,
  CSPR = 506,
  DASH = 5,
  DECRED = 42,
  DEXON = 237,
  DIGIBYTE = 20,
  DOGE = 3,
  ELASTOS = 2305,
  ELLAISM = 163,
  MULTIVERSX = 508,
  ENERGY_WEB_CHAIN = 246,
  EOS = 194,
  ETH = 60,
  ETH_CLASSIC = 61,
  EXPANSE = 40,
  FACTOM = 131,
  FIC = 5248,
  FILECOIN = 461,
  FLOW = 539,
  GAME = 101,
  GOCHAIN = 6060,
  GRS = 17,
  HEDERA = 3030,
  HELIUM = 904,
  HPB = 269,
  HYCON = 1397,
  ICON = 4801368,
  ICP = 223,
  IOTA = 4218,
  IOV = 234,
  KASPA = 111111,
  KIN = 2017,
  KOMODO = 141,
  KUSAMA = 434,
  LBRY = 140,
  LITECOIN = 2,
  LISK = 134,
  MINA = 12586,
  MIX = 76,
  MONERO = 128,
  MUSICOIN = 184,
  NANO = 165,
  NEAR = 397,
  NEM = 43,
  NEO = 888,
  NERVOS = 309,
  NIMIQ = 242,
  NIX = 400,
  NOS = 229,
  ONTOLOGY = 1024,
  PARTICL = 44,
  PIRL = 164,
  POA = 178,
  POLKADOT = 354,
  QRL = 238,
  QTUM = 88,
  RAVECOIN = 175,
  RIPPLE = 144,
  RISE = 1120,
  REOSC = 2894,
  RESISTANCE = 356,
  SOLANA = 501,
  STACKS = 5757,
  STELLAR = 148,
  SHYFT = 7341,
  TEZOS = 1729,
  THUNDERCORE = 1001,
  TOMO = 889,
  TON = 607,
  TRON = 195,
  UBIQ = 108,
  VECHAIN = 818,
  WANCHAIN = 5718350,
  WAVES = 5741564,
  ZCASH = 133,
  ZCLASSIC = 147,
  ZCOIN = 136,
  ZEN = 121,
  ZILLIQA = 313,
  SUI = 784,
}
