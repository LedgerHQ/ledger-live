import { DeviceLabels } from "./DeviceLabels";

export class Currency {
  constructor(
    public readonly uiName: string,
    public readonly uiLabel: string,
    public readonly deviceLabel: string,
    public readonly sendPattern: DeviceLabels[],
    public readonly receivePattern: DeviceLabels[],
  ) {}
  static readonly BTC = new Currency(
    "Bitcoin",
    "BTC",
    "Bitcoin",
    [
      DeviceLabels.Amount,
      DeviceLabels.Address,
      DeviceLabels.Continue,
      DeviceLabels.Reject,
      DeviceLabels.Sign,
    ],
    [DeviceLabels.Address, DeviceLabels.Approve, DeviceLabels.Reject],
  );
  static readonly tBTC = new Currency(
    "Bitcoin Testnet",
    "𝚝BTC",
    "Bitcoin Testnet",
    [
      DeviceLabels.Amount,
      DeviceLabels.Address,
      DeviceLabels.Continue,
      DeviceLabels.Reject,
      DeviceLabels.Sign,
    ],
    [DeviceLabels.Address, DeviceLabels.Approve, DeviceLabels.Reject],
  );
  static readonly ETH = new Currency(
    "Ethereum",
    "ETH",
    "Ethereum",
    [DeviceLabels.Amount, DeviceLabels.Address, DeviceLabels.Accept, DeviceLabels.Reject],
    [DeviceLabels.Address, DeviceLabels.Approve, DeviceLabels.Reject],
  );
  static readonly tETH = new Currency(
    "Ethereum Holesky",
    "𝚝ETH",
    "Ethereum Holesky",
    [DeviceLabels.Amount, DeviceLabels.Address, DeviceLabels.Accept, DeviceLabels.Reject],
    [DeviceLabels.Address, DeviceLabels.Approve, DeviceLabels.Reject],
  );
  static readonly SOL = new Currency(
    "Solana",
    "SOL",
    "Solana",
    [DeviceLabels.Transfer, DeviceLabels.Recipient, DeviceLabels.Approve, DeviceLabels.Reject],
    [DeviceLabels.Pubkey, DeviceLabels.Approve, DeviceLabels.Reject],
  );
  static readonly ADA = new Currency(
    "Cardano",
    "ADA",
    "Cardano",
    [DeviceLabels.TODO, DeviceLabels.TODO, DeviceLabels.TODO],
    [DeviceLabels.TODO, DeviceLabels.TODO, DeviceLabels.TODO],
  );
  static readonly DOT = new Currency(
    "Polkadot",
    "DOT",
    "Polkadot",
    [DeviceLabels.Dest, DeviceLabels.Amount, DeviceLabels.APPROVE, DeviceLabels.REJECT],
    [DeviceLabels.Address, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );
  static readonly TRX = new Currency(
    "Tron",
    "TRX",
    "Tron",
    [DeviceLabels.Amount, DeviceLabels.To, DeviceLabels.Sign, DeviceLabels.Cancel],
    [DeviceLabels.Address, DeviceLabels.Approve, DeviceLabels.Cancel],
  );
  static readonly XRP = new Currency(
    "Ripple",
    "XRP",
    "Ripple",
    [DeviceLabels.TODO, DeviceLabels.TODO, DeviceLabels.TODO, DeviceLabels.TODO],
    [DeviceLabels.Address, DeviceLabels.Approve, DeviceLabels.Reject],
  );
}
