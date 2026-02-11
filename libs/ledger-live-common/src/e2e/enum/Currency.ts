import { AppInfos } from "./AppInfos";
import { Network } from "./Network";

export type CurrencyType = Currency;

export class Currency {
  constructor(
    public readonly name: string,
    public readonly ticker: string,
    public readonly id: string,
    public readonly speculosApp: AppInfos,
    public readonly networks: Network[],
    public readonly contractAddress?: string,
  ) {}

  static readonly CELO = new Currency("Celo", "CELO", "celo", AppInfos.CELO, [Network.CELO]);

  static readonly INJ = new Currency("Injective", "INJ", "injective", AppInfos.INJECTIVE, [
    Network.INJECTIVE,
  ]);

  static readonly BTC = new Currency("Bitcoin", "BTC", "bitcoin", AppInfos.BITCOIN, [
    Network.BITCOIN,
  ]);

  static readonly APT = new Currency("Aptos", "APT", "aptos", AppInfos.APTOS, [Network.APTOS]);

  static readonly ZEC = new Currency("Zcash", "ZEC", "zcash", AppInfos.ZCASH, [Network.ZCASH]);

  static readonly KAS = new Currency("Kaspa", "KAS", "kaspa", AppInfos.KASPA, [Network.KASPA]);

  static readonly HBAR = new Currency("Hedera", "HBAR", "hedera", AppInfos.HEDERA, [
    Network.HEDERA,
  ]);

  static readonly tBTC = new Currency(
    "Bitcoin Testnet",
    "𝚝BTC",
    "bitcoin_testnet",
    AppInfos.BITCOIN_TESTNET,
    [Network.BITCOIN_TESTNET],
  );
  static readonly DOGE = new Currency("Dogecoin", "DOGE", "dogecoin", AppInfos.DOGECOIN, [
    Network.DOGECOIN,
  ]);
  static readonly ETH = new Currency(
    "Ethereum",
    "ETH",
    "ethereum",
    AppInfos.ETHEREUM,
    [Network.ETHEREUM],
    "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  );
  static readonly sepETH = new Currency(
    "Ethereum Sepolia",
    "ETH",
    "ethereum_sepolia",
    AppInfos.ETHEREUM_SEPOLIA,
    [Network.ETHEREUM_SEPOLIA],
  );
  static readonly ETC = new Currency(
    "Ethereum Classic",
    "ETC",
    "ethereum_classic",
    AppInfos.ETHEREUM_CLASSIC,
    [Network.ETHEREUM_CLASSIC],
  );
  static readonly SOL = new Currency("Solana", "SOL", "solana", AppInfos.SOLANA, [Network.SOLANA]);

  static readonly DOT = new Currency("Polkadot", "DOT", "assethub_polkadot", AppInfos.POLKADOT, [
    Network.POLKADOT,
  ]);
  static readonly TRX = new Currency("Tron", "TRX", "tron", AppInfos.TRON, [Network.TRON]);
  static readonly XRP = new Currency("XRP", "XRP", "ripple", AppInfos.RIPPLE, [Network.XRP]);
  static readonly ADA = new Currency("Cardano", "ADA", "cardano", AppInfos.CARDANO, [
    Network.CARDANO,
  ]);
  static readonly XLM = new Currency("Stellar", "XLM", "stellar", AppInfos.STELLAR, [
    Network.STELLAR,
  ]);
  static readonly BCH = new Currency("Bitcoin Cash", "BCH", "bitcoin_cash", AppInfos.BITCOIN_CASH, [
    Network.BITCOIN_CASH,
  ]);
  static readonly ALGO = new Currency("Algorand", "ALGO", "algorand", AppInfos.ALGORAND, [
    Network.ALGORAND,
  ]);
  static readonly ATOM = new Currency("Cosmos", "ATOM", "cosmos", AppInfos.COSMOS, [
    Network.COSMOS,
  ]);
  static readonly XTZ = new Currency("Tezos", "XTZ", "tezos", AppInfos.TEZOS, [Network.TEZOS]);
  static readonly POL = new Currency("Polygon", "POL", "polygon", AppInfos.POLYGON, [
    Network.POLYGON,
  ]);
  static readonly BSC = new Currency("BNB Chain", "BNB", "bsc", AppInfos.BNB_CHAIN, [
    Network.BNB_CHAIN,
  ]);
  static readonly TON = new Currency("TON", "TON", "ton", AppInfos.TON, [Network.TON]);
  static readonly ETH_USDT = new Currency(
    "Tether USD",
    "USDT",
    "ethereum/erc20/usd_tether__erc20_",
    AppInfos.ETHEREUM,
    [
      Network.ETHEREUM,
      Network.ARBITRUM,
      Network.POLYGON,
      Network.OPTIMISM,
      Network.BASE,
      Network.SCROLL,
    ],
    "0xdac17f958d2ee523a2206206994597c13d831ec7",
  );
  static readonly ETH_USDC = new Currency(
    "USD Coin",
    "USDC",
    "ethereum/erc20/usd__coin",
    AppInfos.ETHEREUM,
    [
      Network.ETHEREUM,
      Network.ARBITRUM,
      Network.POLYGON,
      Network.OPTIMISM,
      Network.BASE,
      Network.SCROLL,
    ],
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  );
  static readonly ETH_LIDO = new Currency(
    "LIDO Staked ETH",
    "STETH",
    "ethereum/erc20/steth",
    AppInfos.ETHEREUM,
    [Network.ETHEREUM],
  );
  static readonly XLM_USCD = new Currency("USDC", "USDC", "stellar", AppInfos.STELLAR, [
    Network.STELLAR,
  ]);
  static readonly ALGO_USDT = new Currency("Tether USDt", "USDT", "algorand", AppInfos.ALGORAND, [
    Network.ALGORAND,
  ]);
  static readonly TRX_USDT = new Currency("Tether USD", "USDT", "tron", AppInfos.TRON, [
    Network.TRON,
  ]);
  static readonly TRX_BTT = new Currency("BitTorrent", "BTT", "tron", AppInfos.TRON, [
    Network.TRON,
  ]);
  static readonly BSC_BUSD = new Currency(
    "Binance-Peg BUSD Token",
    "BUSD",
    "bsc",
    AppInfos.BNB_CHAIN,
    [Network.BNB_CHAIN, Network.POLYGON],
  );
  static readonly POL_DAI = new Currency(
    "(PoS) Dai Stablecoin",
    "DAI",
    "polygon",
    AppInfos.POLYGON,
    [Network.POLYGON],
  );
  static readonly POL_UNI = new Currency("Uniswap (PoS)", "UNI", "polygon", AppInfos.POLYGON, [
    Network.POLYGON,
  ]);
  static readonly NEAR = new Currency("NEAR", "NEAR", "near", AppInfos.NEAR, [Network.NEAR]);
  static readonly OSMO = new Currency("Osmosis", "OSMO", "osmo", AppInfos.OSMOSIS, [
    Network.OSMOSIS,
  ]);
  static readonly MULTIVERS_X = new Currency("MultiversX", "EGLD", "elrond", AppInfos.MULTIVERS_X, [
    Network.MULTIVERS_X,
  ]);
  static readonly LTC = new Currency("Litecoin", "LTC", "litecoin", AppInfos.LTC, [
    Network.LITECOIN,
  ]);
  static readonly SOL_GIGA = new Currency(
    "GIGACHAD",
    "GIGA",
    "solana",
    AppInfos.SOLANA,
    [Network.SOLANA],
    "63LfDmNb3MQ8mw9MtZ2To9bEA2M71kZUUGq5tiJxcqj9",
  );
  static readonly SOL_WIF = new Currency(
    "DOGWIFHAT",
    "WIF",
    "solana",
    AppInfos.SOLANA,
    [Network.SOLANA],
    "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
  );

  static readonly OP = new Currency("OP Mainnet", "OP", "optimism", AppInfos.ETHEREUM, [
    Network.OPTIMISM,
  ]);

  static readonly SUI = new Currency("Sui", "SUI", "sui", AppInfos.SUI, [Network.SUI]);

  static readonly BASE = new Currency("Base", "ETH", "base", AppInfos.BASE, [Network.BASE]);

  static readonly VET = new Currency("Vechain", "VET", "vechain", AppInfos.VECHAIN, [
    Network.VECHAIN,
  ]);

  static readonly SUI_USDC = new Currency(
    "USD Coin",
    "USDC",
    "sui/coin/usdc_0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::usdc",
    AppInfos.SUI,
    [Network.SUI],
    "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7",
  );
}
