import { DeviceLabels } from "./DeviceLabels";

export class AppInfos {
  constructor(
    public readonly name: string,
    public readonly sendPattern?: DeviceLabels[],
    public readonly receivePattern?: DeviceLabels[],
    public readonly delegatePattern?: DeviceLabels[],
  ) {}

  static readonly BITCOIN = new AppInfos(
    "Bitcoin",
    [
      DeviceLabels.AMOUNT,
      DeviceLabels.ADDRESS,
      DeviceLabels.CONTINUE,
      DeviceLabels.REJECT,
      DeviceLabels.SIGN,
    ],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );

  static readonly BITCOIN_TESTNET = new AppInfos(
    "Bitcoin Test",
    [
      DeviceLabels.AMOUNT,
      DeviceLabels.ADDRESS,
      DeviceLabels.CONTINUE,
      DeviceLabels.REJECT,
      DeviceLabels.SIGN,
    ],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );

  static readonly DOGECOIN = new AppInfos(
    "Dogecoin",
    [DeviceLabels.AMOUNT, DeviceLabels.ADDRESS, DeviceLabels.ACCEPT, DeviceLabels.REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );

  static readonly ETHEREUM = new AppInfos(
    "Ethereum",
    [DeviceLabels.AMOUNT, DeviceLabels.TO, DeviceLabels.ACCEPT, DeviceLabels.REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );

  static readonly ETHEREUM_HOLESKY = new AppInfos(
    "Ethereum Holesky",
    [DeviceLabels.AMOUNT, DeviceLabels.TO, DeviceLabels.ACCEPT, DeviceLabels.REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );

  static readonly ETHEREUM_SEPOLIA = new AppInfos(
    "Ethereum Sepolia",
    [DeviceLabels.AMOUNT, DeviceLabels.TO, DeviceLabels.ACCEPT, DeviceLabels.REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );

  static readonly ETHEREUM_CLASSIC = new AppInfos(
    "Ethereum Classic",
    [DeviceLabels.AMOUNT, DeviceLabels.TO, DeviceLabels.ACCEPT, DeviceLabels.REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );

  static readonly SOLANA = new AppInfos(
    "Solana",
    [DeviceLabels.TRANSFER, DeviceLabels.RECIPIENT, DeviceLabels.APPROVE, DeviceLabels.REJECT],
    [DeviceLabels.PUBKEY, DeviceLabels.APPROVE, DeviceLabels.REJECT],
    [DeviceLabels.DELEGATE_FROM, DeviceLabels.DEPOSIT, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );

  static readonly POLKADOT = new AppInfos(
    "Polkadot",
    [DeviceLabels.DEST, DeviceLabels.AMOUNT, DeviceLabels.CAPS_APPROVE, DeviceLabels.CAPS_REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.CAPS_APPROVE, DeviceLabels.CAPS_REJECT],
  );

  static readonly TRON = new AppInfos(
    "Tron",
    [DeviceLabels.AMOUNT, DeviceLabels.TO, DeviceLabels.SIGN, DeviceLabels.CANCEL],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.CANCEL],
  );

  static readonly RIPPLE = new AppInfos(
    "Ripple",
    [DeviceLabels.AMOUNT, DeviceLabels.DESTINATION, DeviceLabels.SIGN, DeviceLabels.REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );

  static readonly CARDANO = new AppInfos(
    "Cardano",
    [DeviceLabels.SEND, DeviceLabels.SEND_TO_ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.CONFIRM, DeviceLabels.REJECT],
  );

  static readonly STELLAR = new AppInfos(
    "Stellar",
    [DeviceLabels.SEND, DeviceLabels.DESTINATION, DeviceLabels.FINALIZE, DeviceLabels.CANCEL],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );

  static readonly BITCOIN_CASH = new AppInfos(
    "Bitcoin Cash",
    [DeviceLabels.AMOUNT, DeviceLabels.ADDRESS, DeviceLabels.ACCEPT, DeviceLabels.REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );

  static readonly ALGORAND = new AppInfos(
    "Algorand",
    [
      DeviceLabels.AMOUNT,
      DeviceLabels.RECEIVER,
      DeviceLabels.CAPS_APPROVE,
      DeviceLabels.CAPS_REJECT,
    ],
    [DeviceLabels.ADDRESS, DeviceLabels.CAPS_APPROVE, DeviceLabels.CAPS_REJECT],
  );

  static readonly COSMOS = new AppInfos(
    "Cosmos",
    [DeviceLabels.AMOUNT, DeviceLabels.TO, DeviceLabels.CAPS_APPROVE, DeviceLabels.CAPS_REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.CAPS_APPROVE, DeviceLabels.CAPS_REJECT],
    [
      DeviceLabels.PLEASE_REVIEW,
      DeviceLabels.AMOUNT,
      DeviceLabels.CAPS_APPROVE,
      DeviceLabels.CAPS_REJECT,
    ],
  );

  static readonly TEZOS = new AppInfos(
    "Tezos",
    [DeviceLabels.AMOUNT, DeviceLabels.DESTINATION, DeviceLabels.ACCEPT, DeviceLabels.REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );

  static readonly POLYGON = new AppInfos(
    "Polygon",
    [DeviceLabels.AMOUNT, DeviceLabels.ADDRESS, DeviceLabels.ACCEPT, DeviceLabels.REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );

  static readonly BINANCE_SMART_CHAIN = new AppInfos(
    "Binance Smart Chain",
    [DeviceLabels.AMOUNT, DeviceLabels.ADDRESS, DeviceLabels.ACCEPT, DeviceLabels.REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );

  static readonly TON = new AppInfos(
    "Ton",
    [DeviceLabels.AMOUNT, DeviceLabels.TO, DeviceLabels.APPROVE, DeviceLabels.REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );

  static readonly NEAR = new AppInfos(
    "Near",
    [DeviceLabels.AMOUNT, DeviceLabels.DESTINATION, DeviceLabels.ACCEPT, DeviceLabels.REJECT],
    [DeviceLabels.WALLET_ID, DeviceLabels.APPROVE, DeviceLabels.REJECT],
    [
      DeviceLabels.VIEW_HEADER,
      DeviceLabels.RECEIVER,
      DeviceLabels.CONTINUE_TO_ACTION,
      DeviceLabels.VIEW_ACTION,
      DeviceLabels.METHOD_NAME,
      DeviceLabels.DEPOSIT,
      DeviceLabels.REJECT,
      DeviceLabels.SIGN,
    ],
  );

  static readonly MULTIVERSE_X = new AppInfos(
    "Multiverse X",
    [DeviceLabels.AMOUNT, DeviceLabels.DESTINATION, DeviceLabels.ACCEPT, DeviceLabels.REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );

  static readonly OSMOSIS = new AppInfos(
    "Osmosis",
    [DeviceLabels.AMOUNT, DeviceLabels.DESTINATION, DeviceLabels.ACCEPT, DeviceLabels.REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );

  static readonly LS = new AppInfos("LedgerSync");

  static readonly EXCHANGE = new AppInfos("Exchange", [
    DeviceLabels.SEND,
    DeviceLabels.GET,
    DeviceLabels.FEES,
    DeviceLabels.ACCEPT_AND_SEND,
    DeviceLabels.REJECT,
  ]);
}
