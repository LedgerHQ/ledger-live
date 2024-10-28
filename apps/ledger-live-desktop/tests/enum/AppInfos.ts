export class AppInfos {
  constructor(public readonly name: string) {}

  static readonly BITCOIN = new AppInfos("Bitcoin");

  static readonly BITCOIN_TESTNET = new AppInfos("Bitcoin Test");

  static readonly DOGECOIN = new AppInfos("Dogecoin");

  static readonly ETHEREUM = new AppInfos("Ethereum");

  static readonly ETHEREUM_HOLESKY = new AppInfos("Ethereum Holesky");

  static readonly ETHEREUM_SEPOLIA = new AppInfos("Ethereum Sepolia");

  static readonly ETHEREUM_CLASSIC = new AppInfos("Ethereum Classic");

  static readonly SOLANA = new AppInfos("Solana");

  static readonly POLKADOT = new AppInfos("Polkadot");

  static readonly TRON = new AppInfos("Tron");

  static readonly RIPPLE = new AppInfos("Ripple");

  static readonly CARDANO = new AppInfos("Cardano");

  static readonly STELLAR = new AppInfos("Stellar");

  static readonly BITCOIN_CASH = new AppInfos("Bitcoin Cash");

  static readonly ALGORAND = new AppInfos("Algorand");

  static readonly COSMOS = new AppInfos("Cosmos");

  static readonly TEZOS = new AppInfos("Tezos");

  static readonly POLYGON = new AppInfos("Polygon");

  static readonly BINANCE_SMART_CHAIN = new AppInfos("Binance Smart Chain");

  static readonly TON = new AppInfos("Ton");

  static readonly NEAR = new AppInfos("Near");

  static readonly MULTIVERSE_X = new AppInfos("Multiverse X");

  static readonly OSMOSIS = new AppInfos("Osmosis");

  static readonly LS = new AppInfos("LedgerSync");

  static readonly EXCHANGE = new AppInfos("Exchange");
}
