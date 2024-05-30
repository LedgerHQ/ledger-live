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
      DeviceLabels.AMOUT,
      DeviceLabels.ADDRESS,
      DeviceLabels.CONTINUE,
      DeviceLabels.REJECT,
      DeviceLabels.SIGN,
    ],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );
  static readonly tBTC = new Currency(
    "Bitcoin Testnet",
    "𝚝BTC",
    "Bitcoin Testnet",
    [
      DeviceLabels.AMOUT,
      DeviceLabels.ADDRESS,
      DeviceLabels.CONTINUE,
      DeviceLabels.REJECT,
      DeviceLabels.SIGN,
    ],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );
  static readonly ETH = new Currency(
    "Ethereum",
    "ETH",
    "Ethereum",
    [DeviceLabels.AMOUT, DeviceLabels.ADDRESS, DeviceLabels.ACCEPT, DeviceLabels.REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );
  static readonly tETH = new Currency(
    "Ethereum Holesky",
    "𝚝ETH",
    "Ethereum Holesky",
    [DeviceLabels.AMOUT, DeviceLabels.ADDRESS, DeviceLabels.ACCEPT, DeviceLabels.REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );
  static readonly sepETH = new Currency(
    "Ethereum Sepolia",
    "𝚝ETH",
    "Ethereum Sepolia",
    [DeviceLabels.AMOUT, DeviceLabels.ADDRESS, DeviceLabels.ACCEPT, DeviceLabels.REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );
  static readonly SOL = new Currency(
    "Solana",
    "SOL",
    "Solana",
    [DeviceLabels.TRANSFER, DeviceLabels.RECIPIENT, DeviceLabels.APPROVE, DeviceLabels.REJECT],
    [DeviceLabels.PUBKEY, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );

  static readonly DOT = new Currency(
    "Polkadot",
    "DOT",
    "Polkadot",
    [DeviceLabels.DEST, DeviceLabels.AMOUT, DeviceLabels.CAPS_APPROVE, DeviceLabels.CAPS_REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.CAPS_APPROVE, DeviceLabels.CAPS_REJECT],
  );
  static readonly TRX = new Currency(
    "Tron",
    "TRX",
    "Tron",
    [DeviceLabels.AMOUT, DeviceLabels.TO, DeviceLabels.SIGN, DeviceLabels.CANCEL],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.CANCEL],
  );
  static readonly XRP = new Currency(
    "Ripple",
    "XRP",
    "Ripple",
    [DeviceLabels.AMOUT, DeviceLabels.DESTINATION, DeviceLabels.SIGN, DeviceLabels.REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );
  static readonly ADA = new Currency(
    "Cardano",
    "ADA",
    "Cardano",
    [DeviceLabels.AMOUT, DeviceLabels.DEST, DeviceLabels.APPROVE, DeviceLabels.REJECT], //TODO: check
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT], //TODO: check
  );
  static readonly XLM = new Currency(
    "Stellar",
    "XLM",
    "Stellar",
    [DeviceLabels.AMOUT, DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT], //TODO: check
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT], //TODO: check
  );
  static readonly BCH = new Currency(
    "Bitcoin Cash",
    "BCH",
    "Bitcoin Cash",
    [DeviceLabels.AMOUT, DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT], //TODO: check
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT], //TODO: check
  );
  static readonly ALGO = new Currency(
    "Algorand",
    "ALGO",
    "Algorand",
    [DeviceLabels.AMOUT, DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT], //TODO: check
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT], //TODO: check
  );
  static readonly ATOM = new Currency(
    "Cosmos",
    "ATOM",
    "Cosmos",
    [DeviceLabels.AMOUT, DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT], //TODO: check
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT], //TODO: check
  );
  static readonly XTZ = new Currency(
    "Tezos",
    "XTZ",
    "Tezos",
    [DeviceLabels.AMOUT, DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT], //TODO: check
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT], //TODO: check
  );
}
