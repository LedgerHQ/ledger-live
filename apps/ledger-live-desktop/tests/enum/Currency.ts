import { AppInfos } from "./AppInfos";

export class Currency {
  constructor(
    public readonly name: string,
    public readonly ticker: string,
    public readonly speculosApp: AppInfos,
  ) {}
  static readonly BTC = new Currency("Bitcoin", "BTC", AppInfos.BITCOIN);

  static readonly tBTC = new Currency("Bitcoin Testnet", "𝚝BTC", AppInfos.BITCOIN_TESTNET);
  static readonly DOGE = new Currency("Dogecoin", "DOGE", AppInfos.DOGECOIN);
  static readonly ETH = new Currency("Ethereum", "ETH", AppInfos.ETHEREUM);
  static readonly tETH = new Currency("Ethereum Holesky", "𝚝ETH", AppInfos.ETHEREUM_HOLESKY);
  static readonly sepETH = new Currency("Ethereum Sepolia", "𝚝ETH", AppInfos.ETHEREUM_SEPOLIA);
  static readonly ETC = new Currency("Ethereum Classic", "ETC", AppInfos.ETHEREUM_CLASSIC);
  static readonly SOL = new Currency("Solana", "SOL", AppInfos.SOLANA);

  static readonly DOT = new Currency("Polkadot", "DOT", AppInfos.POLKADOT);
  static readonly TRX = new Currency("Tron", "TRX", AppInfos.TRON);
  static readonly XRP = new Currency("XRP", "XRP", AppInfos.RIPPLE);
  static readonly ADA = new Currency("Cardano", "ADA", AppInfos.CARDANO);
  static readonly XLM = new Currency("Stellar", "XLM", AppInfos.STELLAR);
  static readonly BCH = new Currency("Bitcoin Cash", "BCH", AppInfos.BITCOIN_CASH);
  static readonly ALGO = new Currency("Algorand", "ALGO", AppInfos.ALGORAND);
  static readonly ATOM = new Currency("Cosmos", "ATOM", AppInfos.COSMOS);
  static readonly XTZ = new Currency("Tezos", "XTZ", AppInfos.TEZOS);
  static readonly POL = new Currency("Polygon", "POL", AppInfos.POLYGON);
  static readonly BSC = new Currency("Binance Smart Chain", "BNB", AppInfos.BINANCE_SMART_CHAIN);
  static readonly TON = new Currency("Ton", "TON", AppInfos.TON);
  static readonly ETH_USDT = new Currency("Tether USD", "USDT", AppInfos.ETHEREUM);
  static readonly ETH_LIDO = new Currency("LIDO Staked ETH", "STETH", AppInfos.ETHEREUM);
  static readonly XLM_USCD = new Currency("USDC", "usdc", AppInfos.STELLAR);
  static readonly ALGO_USDT = new Currency("Tether USDt", "USDT", AppInfos.ALGORAND);
  static readonly TRX_USDT = new Currency("Tether USD", "USDT", AppInfos.TRON);
  static readonly TRX_BTT = new Currency("BitTorrent", "BTT", AppInfos.TRON);
  static readonly BSC_BUSD = new Currency(
    "Binance-Peg BUSD Token",
    "BUSD",
    AppInfos.BINANCE_SMART_CHAIN,
  );
  static readonly BSC_SHIBA = new Currency("Shiba Inu", "SHIB", AppInfos.BINANCE_SMART_CHAIN);
  static readonly POL_DAI = new Currency("(PoS) Dai Stablecoin", "DAI", AppInfos.POLYGON);
  static readonly POL_UNI = new Currency("Uniswap (PoS)", "UNI", AppInfos.POLYGON);
}
