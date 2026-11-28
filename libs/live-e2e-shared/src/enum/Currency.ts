import { AppInfos } from "./AppInfos";
import { Network } from "./Network";

export type CurrencyType = Currency;

type CurrencyMarket = { readonly id: string; readonly name: string };

type CurrencyOptions = {
  name: string;
  ticker: string;
  id: string;
  speculosApp: AppInfos;
  networks: Network[];
  contractAddress?: string;
  aggregatedName?: string;
  market?: CurrencyMarket;
};

export class Currency {
  public readonly name: string;
  public readonly ticker: string;
  public readonly id: string;
  public readonly speculosApp: AppInfos;
  public readonly networks: Network[];
  public readonly contractAddress?: string;
  public readonly aggregatedName?: string;
  public readonly market?: CurrencyMarket;

  constructor(options: CurrencyOptions) {
    this.name = options.name;
    this.ticker = options.ticker;
    this.id = options.id;
    this.speculosApp = options.speculosApp;
    this.networks = options.networks;
    this.contractAddress = options.contractAddress;
    this.aggregatedName = options.aggregatedName;
    this.market = options.market;
  }

  toString(): string {
    return this.ticker;
  }

  /**
   * Label used in the `[…]` prefix of e2e test names. Defaults to the ticker; tokens and
   * the currencies that share a ticker with another one carry their network so the name
   * stays unique across LWD and LWM. See CURRENCY_TEST_LABELS.
   */
  get testLabel(): string {
    return CURRENCY_TEST_LABELS.get(this) ?? this.ticker;
  }

  /** Name the CLI resolves to this currency; the Speculos app name when it has no entry. */
  get cliKeyword(): string {
    return CLI_CURRENCY_KEYWORDS.get(this) ?? this.speculosApp.name;
  }

  static readonly CELO = new Currency({
    name: "Celo",
    ticker: "CELO",
    id: "celo",
    speculosApp: AppInfos.CELO,
    networks: [Network.CELO],
  });

  static readonly INJ = new Currency({
    name: "Injective",
    ticker: "INJ",
    id: "injective",
    speculosApp: AppInfos.INJECTIVE,
    networks: [Network.INJECTIVE],
  });

  static readonly BTC = new Currency({
    name: "Bitcoin",
    ticker: "BTC",
    id: "bitcoin",
    speculosApp: AppInfos.BITCOIN,
    networks: [Network.BITCOIN],
  });

  static readonly APT = new Currency({
    name: "Aptos",
    ticker: "APT",
    id: "aptos",
    speculosApp: AppInfos.APTOS,
    networks: [Network.APTOS],
  });

  static readonly ZEC = new Currency({
    name: "Zcash",
    ticker: "ZEC",
    id: "zcash",
    speculosApp: AppInfos.ZCASH,
    networks: [Network.ZCASH],
  });

  static readonly KAS = new Currency({
    name: "Kaspa",
    ticker: "KAS",
    id: "kaspa",
    speculosApp: AppInfos.KASPA,
    networks: [Network.KASPA],
  });

  // Addresses derive through the Ethereum app.
  static readonly HYPERCORE = new Currency({
    name: "Hyperliquid",
    ticker: "USDC",
    id: "hypercore",
    speculosApp: AppInfos.ETHEREUM,
    networks: [],
  });
  static readonly HBAR = new Currency({
    name: "Hedera",
    ticker: "HBAR",
    id: "hedera",
    speculosApp: AppInfos.HEDERA,
    networks: [Network.HEDERA],
  });

  static readonly tBTC = new Currency({
    name: "Bitcoin Testnet",
    ticker: "𝚝BTC",
    id: "bitcoin_testnet",
    speculosApp: AppInfos.BITCOIN_TESTNET,
    networks: [Network.BITCOIN_TESTNET],
  });
  static readonly DOGE = new Currency({
    name: "Dogecoin",
    ticker: "DOGE",
    id: "dogecoin",
    speculosApp: AppInfos.DOGECOIN,
    networks: [Network.DOGECOIN],
  });
  static readonly ETH = new Currency({
    name: "Ethereum",
    ticker: "ETH",
    id: "ethereum",
    speculosApp: AppInfos.ETHEREUM,
    networks: [Network.ETHEREUM],
    contractAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  });
  static readonly ETC = new Currency({
    name: "Ethereum Classic",
    ticker: "ETC",
    id: "ethereum_classic",
    speculosApp: AppInfos.ETHEREUM_CLASSIC,
    networks: [Network.ETHEREUM_CLASSIC],
  });
  static readonly SOL = new Currency({
    name: "Solana",
    ticker: "SOL",
    id: "solana",
    speculosApp: AppInfos.SOLANA,
    networks: [Network.SOLANA],
  });

  static readonly DOT = new Currency({
    name: "Polkadot",
    ticker: "DOT",
    id: "assethub_polkadot",
    speculosApp: AppInfos.POLKADOT,
    networks: [Network.POLKADOT],
  });
  static readonly TRX = new Currency({
    name: "Tron",
    ticker: "TRX",
    id: "tron",
    speculosApp: AppInfos.TRON,
    networks: [Network.TRON],
  });
  static readonly XRP = new Currency({
    name: "XRPL",
    ticker: "XRP",
    id: "ripple",
    speculosApp: AppInfos.RIPPLE,
    networks: [Network.XRP],
  });
  static readonly ADA = new Currency({
    name: "Cardano",
    ticker: "ADA",
    id: "cardano",
    speculosApp: AppInfos.CARDANO,
    networks: [Network.CARDANO],
  });
  static readonly XLM = new Currency({
    name: "Stellar",
    ticker: "XLM",
    id: "stellar",
    speculosApp: AppInfos.STELLAR,
    networks: [Network.STELLAR],
  });
  static readonly BCH = new Currency({
    name: "Bitcoin Cash",
    ticker: "BCH",
    id: "bitcoin_cash",
    speculosApp: AppInfos.BITCOIN_CASH,
    networks: [Network.BITCOIN_CASH],
  });
  static readonly ALGO = new Currency({
    name: "Algorand",
    ticker: "ALGO",
    id: "algorand",
    speculosApp: AppInfos.ALGORAND,
    networks: [Network.ALGORAND],
  });
  static readonly ATOM = new Currency({
    name: "Cosmos",
    ticker: "ATOM",
    id: "cosmos",
    speculosApp: AppInfos.COSMOS,
    networks: [Network.COSMOS],
  });
  static readonly XTZ = new Currency({
    name: "Tezos",
    ticker: "XTZ",
    id: "tezos",
    speculosApp: AppInfos.TEZOS,
    networks: [Network.TEZOS],
  });
  static readonly POL = new Currency({
    name: "Polygon",
    ticker: "POL",
    id: "polygon",
    speculosApp: AppInfos.POLYGON,
    networks: [Network.POLYGON],
  });
  static readonly BSC = new Currency({
    name: "BNB Smart Chain",
    ticker: "BNB",
    id: "bsc",
    speculosApp: AppInfos.BNB_SMART_CHAIN,
    networks: [Network.BNB_SMART_CHAIN],
  });
  static readonly GRAM = new Currency({
    name: "Gram",
    ticker: "GRAM",
    id: "ton",
    speculosApp: AppInfos.TON,
    networks: [Network.TON],
  });
  static readonly ETH_USDT = new Currency({
    name: "Tether USD",
    ticker: "USDT",
    id: "ethereum/erc20/usd_tether__erc20_",
    speculosApp: AppInfos.ETHEREUM,
    networks: [
      Network.ETHEREUM,
      Network.ARBITRUM,
      Network.POLYGON,
      Network.OPTIMISM,
      Network.BASE,
      Network.SCROLL,
    ],
    contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    market: { id: "tether", name: "Tether" },
  });
  static readonly ETH_USDC = new Currency({
    name: "USD Coin",
    ticker: "USDC",
    id: "ethereum/erc20/usd__coin",
    speculosApp: AppInfos.ETHEREUM,
    networks: [
      Network.ETHEREUM,
      Network.ARBITRUM,
      Network.POLYGON,
      Network.OPTIMISM,
      Network.BASE,
      Network.SCROLL,
    ],
    contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    aggregatedName: "USD Coin",
  });
  static readonly ETH_WBTC = new Currency({
    name: "Wrapped Bitcoin",
    ticker: "WBTC",
    id: "ethereum/erc20/wrapped_bitcoin",
    speculosApp: AppInfos.ETHEREUM,
    networks: [Network.ETHEREUM],
    contractAddress: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  });
  static readonly ETH_LIDO = new Currency({
    name: "LIDO Staked ETH",
    ticker: "STETH",
    id: "ethereum/erc20/steth",
    speculosApp: AppInfos.ETHEREUM,
    networks: [Network.ETHEREUM],
  });
  static readonly ETH_WGNK = new Currency({
    name: "Wrapped Gonka",
    ticker: "WGNK",
    id: "ethereum/erc20/wrapped_gonka_0x972a7a92d92796a98801a8818bcf91f1648f2f68",
    speculosApp: AppInfos.ETHEREUM,
    networks: [Network.ETHEREUM],
    contractAddress: "0x972a7A92D92796a98801A8818bcF91f1648f2F68",
  });
  static readonly XLM_USDC = new Currency({
    name: "USDC",
    ticker: "USDC",
    id: "stellar",
    speculosApp: AppInfos.STELLAR,
    networks: [Network.STELLAR],
    aggregatedName: "USD Coin",
  });
  static readonly ALGO_USDT = new Currency({
    name: "Tether USDt",
    ticker: "USDT",
    id: "algorand",
    speculosApp: AppInfos.ALGORAND,
    networks: [Network.ALGORAND],
  });
  static readonly TRX_USDT = new Currency({
    name: "Tether USD",
    ticker: "USDT",
    id: "tron",
    speculosApp: AppInfos.TRON,
    networks: [Network.TRON],
  });
  static readonly TRX_BTT = new Currency({
    name: "BitTorrent",
    ticker: "BTT",
    id: "tron",
    speculosApp: AppInfos.TRON,
    networks: [Network.TRON],
  });
  static readonly BSC_BUSD = new Currency({
    name: "Binance-Peg BUSD Token",
    ticker: "BUSD",
    id: "bsc",
    speculosApp: AppInfos.BNB_SMART_CHAIN,
    networks: [Network.BNB_SMART_CHAIN, Network.POLYGON],
  });
  static readonly POL_DAI = new Currency({
    name: "(PoS) Dai Stablecoin",
    ticker: "DAI",
    id: "polygon",
    speculosApp: AppInfos.POLYGON,
    networks: [Network.POLYGON],
    aggregatedName: "Dai Stablecoin v2.0",
  });
  static readonly POL_UNI = new Currency({
    name: "Uniswap (PoS)",
    ticker: "UNI",
    id: "polygon",
    speculosApp: AppInfos.POLYGON,
    networks: [Network.POLYGON],
  });
  static readonly NEAR = new Currency({
    name: "NEAR",
    ticker: "NEAR",
    id: "near",
    speculosApp: AppInfos.NEAR,
    networks: [Network.NEAR],
  });
  static readonly OSMO = new Currency({
    name: "Osmosis",
    ticker: "OSMO",
    id: "osmo",
    speculosApp: AppInfos.OSMOSIS,
    networks: [Network.OSMOSIS],
  });
  static readonly BABY = new Currency({
    name: "Babylon",
    ticker: "BABY",
    id: "babylon",
    speculosApp: AppInfos.BABYLON,
    networks: [Network.BABYLON],
  });
  static readonly MULTIVERS_X = new Currency({
    name: "MultiversX",
    ticker: "EGLD",
    id: "elrond",
    speculosApp: AppInfos.MULTIVERS_X,
    networks: [Network.MULTIVERS_X],
  });
  static readonly LTC = new Currency({
    name: "Litecoin",
    ticker: "LTC",
    id: "litecoin",
    speculosApp: AppInfos.LTC,
    networks: [Network.LITECOIN],
  });
  static readonly SOL_GIGA = new Currency({
    name: "GIGACHAD",
    ticker: "GIGA",
    id: "solana",
    speculosApp: AppInfos.SOLANA,
    networks: [Network.SOLANA],
    contractAddress: "63LfDmNb3MQ8mw9MtZ2To9bEA2M71kZUUGq5tiJxcqj9",
  });
  static readonly SOL_WIF = new Currency({
    name: "DOGWIFHAT",
    ticker: "WIF",
    id: "solana",
    speculosApp: AppInfos.SOLANA,
    networks: [Network.SOLANA],
    contractAddress: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
  });

  static readonly OP = new Currency({
    name: "OP Mainnet",
    ticker: "OP",
    id: "optimism",
    speculosApp: AppInfos.ETHEREUM,
    networks: [Network.OPTIMISM],
  });

  static readonly SUI = new Currency({
    name: "Sui",
    ticker: "SUI",
    id: "sui",
    speculosApp: AppInfos.SUI,
    networks: [Network.SUI],
  });

  static readonly BASE = new Currency({
    name: "Base",
    ticker: "ETH",
    id: "base",
    speculosApp: AppInfos.BASE,
    networks: [Network.BASE],
  });

  static readonly BASE_AERODROME = new Currency({
    name: "Aerodrome",
    ticker: "AERO",
    id: "base/erc20/aerodrome",
    speculosApp: AppInfos.BASE,
    networks: [Network.BASE],
    contractAddress: "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3",
  });

  static readonly VET = new Currency({
    name: "Vechain",
    ticker: "VET",
    id: "vechain",
    speculosApp: AppInfos.VECHAIN,
    networks: [Network.VECHAIN],
  });

  static readonly MINA = new Currency({
    name: "Mina",
    ticker: "MINA",
    id: "mina",
    speculosApp: AppInfos.MINA,
    networks: [Network.MINA],
  });

  static readonly SUI_USDC = new Currency({
    name: "USD Coin",
    ticker: "USDC",
    id: "sui/coin/usdc_0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::usdc",
    speculosApp: AppInfos.SUI,
    networks: [Network.SUI],
    contractAddress: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7",
    aggregatedName: "USD Coin",
  });

  static readonly ALEO = new Currency({
    name: "Aleo",
    ticker: "ALEO",
    id: "aleo",
    speculosApp: AppInfos.ALEO,
    networks: [Network.ALEO],
  });

  static readonly ICP = new Currency({
    name: "Internet Computer",
    ticker: "ICP",
    id: "internet_computer",
    speculosApp: AppInfos.INTERNET_COMPUTER,
    networks: [Network.INTERNET_COMPUTER],
  });

  static readonly CCD_TESTNET = new Currency({
    name: "Concordium (Testnet)",
    ticker: "CCD",
    id: "concordium_testnet",
    speculosApp: AppInfos.CONCORDIUM_TESTNET,
    networks: [Network.CONCORDIUM],
  });

  static readonly SEI_EVM = new Currency({
    name: "SEI Network (EVM)",
    ticker: "SEI",
    id: "sei_evm",
    speculosApp: AppInfos.SEI,
    networks: [Network.SEI],
  });
}

// Currencies that derive through another coin's app, so the app name is not their CLI name.
const CLI_CURRENCY_KEYWORDS = new Map<Currency, string>([[Currency.HYPERCORE, "hypercore"]]);

const CURRENCY_TEST_LABELS = new Map<Currency, string>([
  [Currency.BASE, "ETH (Base)"],
  [Currency.ETH_USDT, "USDT (Ethereum)"],
  [Currency.ETH_USDC, "USDC (Ethereum)"],
  [Currency.ETH_WBTC, "WBTC (Ethereum)"],
  [Currency.ETH_LIDO, "STETH (Ethereum)"],
  [Currency.ETH_WGNK, "WGNK (Ethereum)"],
  [Currency.XLM_USDC, "USDC (Stellar)"],
  [Currency.ALGO_USDT, "USDT (Algorand)"],
  [Currency.TRX_USDT, "USDT (Tron)"],
  [Currency.TRX_BTT, "BTT (Tron)"],
  [Currency.BSC_BUSD, "BUSD (BNB Smart Chain)"],
  [Currency.POL_DAI, "DAI (Polygon)"],
  [Currency.POL_UNI, "UNI (Polygon)"],
  [Currency.SOL_GIGA, "GIGA (Solana)"],
  [Currency.SOL_WIF, "WIF (Solana)"],
  [Currency.SUI_USDC, "USDC (Sui)"],
  [Currency.BASE_AERODROME, "AERO (Base)"],
]);
