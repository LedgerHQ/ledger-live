import { Account } from "./Account";

export class Token {
  constructor(
    public readonly account: Account,
    public readonly tokenName: string,
    public readonly tokenTicker: string,
  ) {}
  static readonly ETH_USDT = new Token(Account.ETH_1, "Tether USD", "USDT");
  static readonly XLM_USCD = new Token(Account.XLM_1, "USDC", "USDC");
  static readonly ALGO_USDT = new Token(Account.ALGO_1, "Tether USDt", "USDT");
  static readonly TRON_WINK = new Token(Account.TRX_1, "WINk", "WIN");
  static readonly BNB_BUSD = new Token(Account.BNB_1, "Binance-Peg BUSD Token", "BUSD");
  static readonly MATIC_DAI = new Token(Account.MATIC_1, "(PoS) Dai Stablecoin", "DAI");
}
