export type SpeculosAppType = AppInfos;

export class AppInfos {
  constructor(public readonly name: string) {}

  static readonly BITCOIN = new AppInfos("Bitcoin");

  static readonly INJECTIVE = new AppInfos("Injective");

  static readonly APTOS = new AppInfos("Aptos");

  static readonly BITCOIN_TESTNET = new AppInfos("Bitcoin Test");

  static readonly DOGECOIN = new AppInfos("Dogecoin");

  static readonly ETHEREUM = new AppInfos("Ethereum");

  static readonly ETHEREUM_SEPOLIA = new AppInfos("Ethereum Sepolia");

  static readonly ETHEREUM_CLASSIC = new AppInfos("Ethereum Classic");

  static readonly SOLANA = new AppInfos("Solana");

  static readonly POLKADOT = new AppInfos("Polkadot");

  static readonly TRON = new AppInfos("Tron");

  static readonly RIPPLE = new AppInfos("XRP");

  static readonly CARDANO = new AppInfos("Cardano");

  static readonly STELLAR = new AppInfos("Stellar");

  static readonly BITCOIN_CASH = new AppInfos("Bitcoin Cash");

  static readonly ALGORAND = new AppInfos("Algorand");

  static readonly COSMOS = new AppInfos("Cosmos");

  static readonly TEZOS = new AppInfos("Tezos");

  static readonly POLYGON = new AppInfos("Polygon");

  static readonly BNB_CHAIN = new AppInfos("BNB Chain");

  static readonly TON = new AppInfos("Ton");

  static readonly NEAR = new AppInfos("Near");

  static readonly MULTIVERS_X = new AppInfos("Multivers X");

  static readonly OSMOSIS = new AppInfos("Osmosis");

  static readonly LS = new AppInfos("LedgerSync");

  static readonly EXCHANGE = new AppInfos("Exchange");

  static readonly CELO = new AppInfos("Celo");

  static readonly LTC = new AppInfos("Litecoin");

  static readonly KASPA = new AppInfos("Kaspa");

  static readonly HEDERA = new AppInfos("Hedera");

  static readonly SUI = new AppInfos("Sui");

  static readonly BASE = new AppInfos("Base");

  static readonly VECHAIN = new AppInfos("Vechain");

  static readonly ZCASH = new AppInfos("Zcash");
}
