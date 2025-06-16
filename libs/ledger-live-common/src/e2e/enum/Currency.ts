import { AppInfos } from "./AppInfos";

export type CurrencyType = Currency;

export class Currency {
  constructor(
    public readonly name: string,
    public readonly ticker: string,
    public readonly id: string,
    public readonly speculosApp: AppInfos,
    public readonly contractAddress?: string,
  ) {}

  static readonly CELO = new Currency("Celo", "CELO", "celo", AppInfos.CELO);

  static readonly INJ = new Currency("Injective", "INJ", "injective", AppInfos.INJECTIVE);

  static readonly BTC = new Currency("Bitcoin", "BTC", "bitcoin", AppInfos.BITCOIN);

  static readonly APT = new Currency("Aptos", "APT", "aptos", AppInfos.APTOS);

  static readonly tBTC = new Currency(
    "Bitcoin Testnet",
    "𝚝BTC",
    "bitcoin_testnet",
    AppInfos.BITCOIN_TESTNET,
  );
  static readonly DOGE = new Currency("Dogecoin", "DOGE", "dogecoin", AppInfos.DOGECOIN);
  static readonly ETH = new Currency(
    "Ethereum",
    "ETH",
    "ethereum",
    AppInfos.ETHEREUM,
    "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  );
  static readonly tETH = new Currency(
    "Ethereum Holesky",
    "𝚝ETH",
    "ethereum_holesky",
    AppInfos.ETHEREUM_HOLESKY,
  );
  static readonly sepETH = new Currency(
    "Ethereum Sepolia",
    "ETH",
    "ethereum_sepolia",
    AppInfos.ETHEREUM_SEPOLIA,
  );
  static readonly ETC = new Currency(
    "Ethereum Classic",
    "ETC",
    "ethereum_classic",
    AppInfos.ETHEREUM_CLASSIC,
  );
  static readonly SOL = new Currency("Solana", "SOL", "solana", AppInfos.SOLANA);

  static readonly DOT = new Currency("Polkadot", "DOT", "polkadot", AppInfos.POLKADOT);
  static readonly TRX = new Currency("Tron", "TRX", "tron", AppInfos.TRON);
  static readonly XRP = new Currency("XRP", "XRP", "ripple", AppInfos.RIPPLE);
  static readonly ADA = new Currency("Cardano", "ADA", "cardano", AppInfos.CARDANO);
  static readonly XLM = new Currency("Stellar", "XLM", "stellar", AppInfos.STELLAR);
  static readonly BCH = new Currency("Bitcoin Cash", "BCH", "bitcoin_cash", AppInfos.BITCOIN_CASH);
  static readonly ALGO = new Currency("Algorand", "ALGO", "algorand", AppInfos.ALGORAND);
  static readonly ATOM = new Currency("Cosmos", "ATOM", "cosmos", AppInfos.COSMOS);
  static readonly XTZ = new Currency("Tezos", "XTZ", "tezos", AppInfos.TEZOS);
  static readonly POL = new Currency("Polygon", "POL", "polygon", AppInfos.POLYGON);
  static readonly BSC = new Currency(
    "Binance Smart Chain",
    "BNB",
    "bsc",
    AppInfos.BINANCE_SMART_CHAIN,
  );
  static readonly TON = new Currency("TON", "TON", "ton", AppInfos.TON);
  static readonly ETH_USDT = new Currency(
    "Tether USD",
    "USDT",
    "ethereum/erc20/usd_tether__erc20_",
    AppInfos.ETHEREUM,
    "0xdac17f958d2ee523a2206206994597c13d831ec7",
  );
  static readonly ETH_USDC = new Currency(
    "USD Coin",
    "USDC",
    "ethereum/erc20/usd__coin",
    AppInfos.ETHEREUM,
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  );
  static readonly ETH_LIDO = new Currency(
    "LIDO Staked ETH",
    "STETH",
    "ethereum",
    AppInfos.ETHEREUM,
  );
  static readonly XLM_USCD = new Currency("USDC", "usdc", "stellar", AppInfos.STELLAR);
  static readonly ALGO_USDT = new Currency("Tether USDt", "USDT", "algorand", AppInfos.ALGORAND);
  static readonly TRX_USDT = new Currency("Tether USD", "USDT", "tron", AppInfos.TRON);
  static readonly TRX_BTT = new Currency("BitTorrent", "BTT", "tron", AppInfos.TRON);
  static readonly BSC_BUSD = new Currency(
    "Binance-Peg BUSD Token",
    "BUSD",
    "bsc",
    AppInfos.BINANCE_SMART_CHAIN,
  );
  static readonly BSC_SHIBA = new Currency(
    "Shiba Inu",
    "SHIB",
    "bsc",
    AppInfos.BINANCE_SMART_CHAIN,
  );
  static readonly POL_DAI = new Currency(
    "(PoS) Dai Stablecoin",
    "DAI",
    "polygon",
    AppInfos.POLYGON,
  );
  static readonly POL_UNI = new Currency("Uniswap (PoS)", "UNI", "polygon", AppInfos.POLYGON);
  static readonly NEAR = new Currency("NEAR", "NEAR", "near", AppInfos.NEAR);
  static readonly OSMO = new Currency("Osmosis", "OSMO", "osmo", AppInfos.OSMOSIS);
  static readonly MULTIVERS_X = new Currency("MultiversX", "EGLD", "elrond", AppInfos.MULTIVERS_X);
  static readonly LTC = new Currency("Litecoin", "LTC", "litecoin", AppInfos.LTC);
  static readonly SOL_GIGA = new Currency(
    "GIGACHAD",
    "GIGA",
    "solana",
    AppInfos.SOLANA,
    "63LfDmNb3MQ8mw9MtZ2To9bEA2M71kZUUGq5tiJxcqj9",
  );
  static readonly SOL_WIF = new Currency(
    "DOGWIFHAT",
    "WIF",
    "solana",
    AppInfos.SOLANA,
    "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
  );
  static readonly OP = new Currency("OP Mainnet", "OP", "optimism", AppInfos.ETHEREUM);
}
