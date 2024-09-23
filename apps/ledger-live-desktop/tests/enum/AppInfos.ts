import { DeviceLabels } from "./DeviceLabels";

export class AppInfos {
  constructor(
    public readonly name: string,
    public readonly sendPattern?: DeviceLabels[],
    public readonly receivePattern?: DeviceLabels[],
    public readonly lsPattern?: DeviceLabels[],
  ) {}
  static readonly BITCOIN = new AppInfos(
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
  static readonly BITCOIN_TESTNET = new AppInfos(
    "Bitcoin Test",
    [
      DeviceLabels.AMOUT,
      DeviceLabels.ADDRESS,
      DeviceLabels.CONTINUE,
      DeviceLabels.REJECT,
      DeviceLabels.SIGN,
    ],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );
  static readonly DOGECOIN = new AppInfos(
    "Dogecoin",
    [DeviceLabels.AMOUT, DeviceLabels.ADDRESS, DeviceLabels.ACCEPT, DeviceLabels.REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );
  static readonly ETHEREUM = new AppInfos(
    "Ethereum",
    [DeviceLabels.AMOUT, DeviceLabels.TO, DeviceLabels.ACCEPT, DeviceLabels.REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );
  static readonly ETHEREUM_HOLESKY = new AppInfos(
    "Ethereum Holesky",
    [DeviceLabels.AMOUT, DeviceLabels.TO, DeviceLabels.ACCEPT, DeviceLabels.REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );
  static readonly ETHEREUM_SEPOLIA = new AppInfos(
    "Ethereum Sepolia",
    [DeviceLabels.AMOUT, DeviceLabels.TO, DeviceLabels.ACCEPT, DeviceLabels.REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );
  static readonly ETHEREUM_CLASSIC = new AppInfos(
    "Ethereum Classic",
    [DeviceLabels.AMOUT, DeviceLabels.TO, DeviceLabels.ACCEPT, DeviceLabels.REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );
  static readonly SOLANA = new AppInfos(
    "Solana",
    [DeviceLabels.TRANSFER, DeviceLabels.RECIPIENT, DeviceLabels.APPROVE, DeviceLabels.REJECT],
    [DeviceLabels.PUBKEY, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );
  static readonly POLKADOT = new AppInfos(
    "Polkadot",
    [DeviceLabels.DEST, DeviceLabels.AMOUT, DeviceLabels.CAPS_APPROVE, DeviceLabels.CAPS_REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.CAPS_APPROVE, DeviceLabels.CAPS_REJECT],
  );
  static readonly TRON = new AppInfos(
    "Tron",
    [DeviceLabels.AMOUT, DeviceLabels.TO, DeviceLabels.SIGN, DeviceLabels.CANCEL],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.CANCEL],
  );
  static readonly RIPPLE = new AppInfos(
    "Ripple",
    [DeviceLabels.AMOUT, DeviceLabels.DESTINATION, DeviceLabels.SIGN, DeviceLabels.REJECT],
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
    [DeviceLabels.AMOUT, DeviceLabels.ADDRESS, DeviceLabels.ACCEPT, DeviceLabels.REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );
  static readonly ALGORAND = new AppInfos(
    "Algorand",
    [
      DeviceLabels.AMOUT,
      DeviceLabels.RECEIVER,
      DeviceLabels.CAPS_APPROVE,
      DeviceLabels.CAPS_REJECT,
    ],
    [DeviceLabels.ADDRESS, DeviceLabels.CAPS_APPROVE, DeviceLabels.CAPS_REJECT],
  );
  static readonly COSMOS = new AppInfos(
    "Cosmos",
    [DeviceLabels.AMOUT, DeviceLabels.TO, DeviceLabels.CAPS_APPROVE, DeviceLabels.CAPS_REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.CAPS_APPROVE, DeviceLabels.CAPS_REJECT],
  );
  static readonly TEZOS = new AppInfos(
    "Tezos",
    [DeviceLabels.AMOUT, DeviceLabels.DESTINATION, DeviceLabels.ACCEPT, DeviceLabels.REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );
  static readonly POLYGON = new AppInfos(
    "Polygon",
    [DeviceLabels.AMOUT, DeviceLabels.ADDRESS, DeviceLabels.ACCEPT, DeviceLabels.REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );
  static readonly BINANCE_SMART_CHAIN = new AppInfos(
    "Binance Smart Chain",
    [DeviceLabels.AMOUT, DeviceLabels.ADDRESS, DeviceLabels.ACCEPT, DeviceLabels.REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );
  static readonly TON = new AppInfos(
    "Ton",
    [DeviceLabels.AMOUT, DeviceLabels.TO, DeviceLabels.APPROVE, DeviceLabels.REJECT],
    [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT],
  );
  static readonly LS = new AppInfos("LedgerSync", [DeviceLabels.LOGIN_LEDGER_SYNC]);
  static readonly EXCHANGE = new AppInfos("Exchange", [
    DeviceLabels.SEND,
    DeviceLabels.GET,
    DeviceLabels.FEES,
    DeviceLabels.ACCEPT_AND_SEND,
    DeviceLabels.REJECT,
  ]);
}
