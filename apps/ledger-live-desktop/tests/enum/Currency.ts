export class Currency {
  constructor(
    public readonly uiName: string,
    public readonly deviceName: string,
  ) {}

  static readonly BTC = new Currency("Bitcoin", "BTC");
  static readonly tBTC = new Currency("Bitcoin Testnet", "tBTC");
  static readonly ETH = new Currency("Ethereum", "ETH");
  static readonly tETH = new Currency("Ethereum Holesky", "tETH");
  static readonly SOL = new Currency("Solana", "SOL");
}
