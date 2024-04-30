export class Currency {
  constructor(
    public readonly uiName: string,
    public readonly uiLabel: string,
    public readonly deviceLabel: string,
    public readonly deviceCurrency: string,
    public readonly sendPattern: string[],
    public readonly receivePattern: string[],
  ) {}
  static readonly BTC = new Currency(
    "Bitcoin",
    "BTC",
    "Bitcoin",
    "BTC",
    ["Amount", "Address", "Continue", "Reject", "Sign"],
    ["Address", "Approve", "Reject"],
  );
  static readonly tBTC = new Currency(
    "Bitcoin Testnet",
    "𝚝BTC",
    "Bitcoin Testnet",
    "𝚝BTC",
    ["Amount", "Address", "Continue", "Reject", "Sign"],
    ["Address", "Approve", "Reject"],
  );
  static readonly ETH = new Currency(
    "Ethereum",
    "ETH",
    "Ethereum",
    "ETH",
    ["Amount", "Address", "Accept", "Reject"],
    ["Address", "Approve", "Reject"],
  );
  static readonly tETH = new Currency(
    "Ethereum Holesky",
    "𝚝ETH",
    "Ethereum Holesky",
    "𝚝ETH",
    ["Amount", "Address", "Accept", "Reject"],
    ["Address", "Approve", "Reject"],
  );
  static readonly SOL = new Currency(
    "Solana",
    "SOL",
    "Solana",
    "SOl",
    ["Transfer", "Recipient", "Approve", "Reject"],
    ["Pubkey", "Approve", "Reject"],
  );
  static readonly ADA = new Currency(
    "Cardano",
    "ADA",
    "Cardano",
    "ADA",
    ["", "", ""],
    ["", "", ""],
  );
  static readonly DOT = new Currency(
    "Polkadot",
    "DOT",
    "Polkadot",
    "DOT",
    ["Dest", "Amount", "APPROVE", "REJECT"],
    ["Address", "APPROVE", "REJECT"],
  );
  static readonly TRX = new Currency(
    "Tron",
    "TRX",
    "Tron",
    "TRX",
    ["Amount", "To", "Sign", "Cancel"],
    ["Address", "Approve", "Cancel"],
  );
  static readonly XRP = new Currency(
    "Ripple",
    "XRP",
    "Ripple",
    "XRP",
    ["", "", "", ""],
    ["Address", "Approve", "Reject"],
  );
}
