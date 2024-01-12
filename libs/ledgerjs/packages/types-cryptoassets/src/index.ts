import { CoinType } from "./slip44";

// All cryptocurrency ids
// list should be append only. **do not modify existing ids**
export type CryptoCurrencyId =
  | "aeternity"
  | "aion"
  | "akroma"
  | "algorand"
  | "ark"
  | "atheios"
  | "avalanche_c_chain"
  | "axelar"
  | "banano"
  | "binance_beacon_chain"
  | "bitcoin"
  | "bitcoin_cash"
  | "bitcoin_gold"
  | "bitcoin_private"
  | "bsc"
  | "callisto"
  | "cardano"
  | "cardano_testnet"
  | "celo"
  | "clubcoin"
  | "coreum"
  | "cosmos"
  | "cosmos_testnet"
  | "dash"
  | "decred"
  | "desmos"
  | "dexon"
  | "dydx"
  | "ellaism"
  | "dogecoin"
  | "digibyte"
  | "eos"
  | "elastos"
  | "elrond"
  | "ethereum"
  | "ethereum_classic"
  | "ether1"
  | "ethergem"
  | "ethersocial"
  | "expanse"
  | "factom"
  | "fic"
  | "flow"
  | "game_credits"
  | "gochain"
  | "groestlcoin"
  | "hcash"
  | "hedera"
  | "helium"
  | "hpb"
  | "hycon"
  | "icon"
  | "iota"
  | "iov"
  | "kin"
  | "komodo"
  | "kusama"
  | "lbry"
  | "litecoin"
  | "lisk"
  | "mix"
  | "monero"
  | "moonriver"
  | "musicoin"
  | "nano"
  | "nem"
  | "neo"
  | "nervos"
  | "nimiq"
  | "nix"
  | "nos"
  | "nyx"
  | "onomy"
  | "ontology"
  | "particl"
  | "peercoin"
  | "persistence"
  | "pirl"
  | "pivx"
  | "poa"
  | "polkadot"
  | "polygon"
  | "poswallet"
  | "qrl"
  | "qtum"
  | "quicksilver"
  | "ravencoin"
  | "ripple"
  | "rise"
  | "reosc"
  | "resistance"
  | "secret_network"
  | "sei_network"
  | "solana"
  | "stakenet"
  | "stargaze"
  | "stratis"
  | "stealthcoin"
  | "stellar"
  | "stride"
  | "osmosis"
  | "shyft"
  | "tezos"
  | "thundercore"
  | "tomo"
  | "tron"
  | "ubiq"
  | "umee"
  | "vechain"
  | "vertcoin"
  | "viacoin"
  | "wanchain"
  | "waves"
  | "zcash"
  | "zclassic"
  | "zcoin"
  | "zencash"
  | "zilliqa"
  | "crypto_org"
  | "bitcoin_testnet"
  | "ethereum_ropsten"
  | "ethereum_goerli"
  | "ethereum_sepolia"
  | "ethereum_holesky"
  | "stacks"
  | "crypto_org_croeseid"
  | "solana_testnet"
  | "solana_devnet"
  | "filecoin"
  | "arbitrum"
  | "arbitrum_goerli"
  | "cronos"
  | "fantom"
  | "flare"
  | "songbird"
  | "moonbeam"
  | "near"
  | "rsk"
  | "bittorrent"
  | "kava_evm"
  | "evmos_evm"
  | "optimism"
  | "optimism_goerli"
  | "energy_web"
  | "astar"
  | "metis"
  | "boba"
  | "moonriver"
  | "velas_evm"
  | "syscoin"
  | "internet_computer"
  | "injective"
  | "telos_evm"
  | "klaytn"
  | "polygon_zk_evm"
  | "polygon_zk_evm_testnet"
  | "base"
  | "base_goerli"
  | "casper"
  | "neon_evm"
  | "lukso";

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
  | "ppc"
  | "pivx"
  | "posw"
  | "qtum"
  | "xsn"
  | "strat"
  | "xst"
  | "vtc"
  | "via"
  | "zec"
  | "zen"
  | "avax"
  | "eth"
  | "eth_ropsten"
  | "eth_goerli"
  | "eth_sepolia"
  | "eth_holesky"
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
  /*
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
  // used by evm coin integration
  node:
    | {
        type: "external";
        uri: string;
      }
    | {
        type: "ledger";
        explorerId: LedgerExplorerId;
      };
  // used by evm coin integration
  explorer?:
    | {
        type: "etherscan" | "blockscout" | "teloscan" | "klaytnfinder";
        uri: string;
      }
    | {
        type: "ledger";
        explorerId: LedgerExplorerId;
      };
  // used by evm coin integration
  gasTracker?: {
    type: "ledger";
    explorerId: LedgerExplorerId;
  };
};

export type BitcoinLikeInfo = {
  P2PKH: number;
  P2SH: number;
  XPUBVersion?: number;
  // FIXME optional as we miss some data to fill
  hasTimestamp?: boolean;
};

/**
 *
 */
export type CryptoCurrency = CurrencyCommon & {
  type: "CryptoCurrency";
  // unique internal id of a crypto currency
  // LBRY | groestcoin | osmo are expectional ids
  // because in `cryptocurrenciesById` the key of the object is different from the id
  id: CryptoCurrencyId | "LBRY" | "groestcoin" | "osmo";
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
};

/**
 *
 */
export type Currency = FiatCurrency | CryptoCurrency | TokenCurrency;

export type CryptoOrTokenCurrency = CryptoCurrency | TokenCurrency;

export { CoinType };
