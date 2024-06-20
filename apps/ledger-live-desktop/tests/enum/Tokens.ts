import { Account } from "./Account";

export class Token {
  constructor(
    public readonly parentAccount: Account,
    public readonly tokenName: string,
    public readonly tokenTicker: string,
    public readonly tokenNetwork: string,
  ) {}
  static readonly ETH_USDT = new Token(Account.ETH_1, "Tether USD", "USDT", "Ethereum");
  static readonly ETH_LIDO = new Token(Account.ETH_1, "LIDO Staked ETH", "STETH", "Ethereum");
  static readonly XLM_USCD = new Token(Account.XLM_1, "USDC", "USDC", "Stellar");
  static readonly ALGO_USDT = new Token(Account.ALGO_1, "Tether USDt", "USDT", "Algorand");
  static readonly TRON_USDT = new Token(Account.TRX_1, "Tether USD", "USDT", "Tron");
  static readonly TRON_BTT = new Token(Account.TRX_1, "BitTorrent", "BTT", "Tron");
  static readonly BSC_BUSD = new Token(
    Account.BSC_1,
    "Binance-Peg BUSD Token",
    "BUSD",
    "Binance Smart Chain",
  );
  static readonly BSC_SHIBA = new Token(Account.BSC_1, "SHIBA INU", "SHIB", "Binance Smart Chain");
  static readonly MATIC_DAI = new Token(Account.MATIC_1, "(PoS) Dai Stablecoin", "DAI", "Polygon");
  static readonly MATIC_UNI = new Token(Account.MATIC_1, "Uniswap (PoS)", "UNI", "Polygon");
}
