import { DeviceLabels } from "./DeviceLabels";
import { AppInfos } from "./AppInfos";

export class Currency {
  constructor(
    public readonly name: string,
    public readonly ticker: string,
    public readonly speculosApp: string,
    public readonly sendPattern: DeviceLabels[],
    public readonly receivePattern: DeviceLabels[],
  ) {}
  static readonly BTC = new Currency(
    "Bitcoin",
    "BTC",
    AppInfos.BITCOIN.name,
    AppInfos.BITCOIN.sendPattern,
    AppInfos.BITCOIN.receivePattern,
  );
  static readonly tBTC = new Currency(
    "Bitcoin Testnet",
    "𝚝BTC",
    AppInfos.BITCOIN_TESTNET.name,
    AppInfos.BITCOIN_TESTNET.sendPattern,
    AppInfos.BITCOIN_TESTNET.receivePattern,
  );
  static readonly DOGE = new Currency(
    "Dogecoin",
    "DOGE",
    AppInfos.DOGECOIN.name,
    AppInfos.DOGECOIN.sendPattern,
    AppInfos.DOGECOIN.receivePattern,
  );
  static readonly ETH = new Currency(
    "Ethereum",
    "ETH",
    AppInfos.ETHEREUM.name,
    AppInfos.ETHEREUM.sendPattern,
    AppInfos.ETHEREUM.receivePattern,
  );
  static readonly tETH = new Currency(
    "Ethereum Holesky",
    "𝚝ETH",
    AppInfos.ETHEREUM_HOLESKY.name,
    AppInfos.ETHEREUM_HOLESKY.sendPattern,
    AppInfos.ETHEREUM_HOLESKY.receivePattern,
  );
  static readonly sepETH = new Currency(
    "Ethereum Sepolia",
    "𝚝ETH",
    AppInfos.ETHEREUM_SEPOLIA.name,
    AppInfos.ETHEREUM_SEPOLIA.sendPattern,
    AppInfos.ETHEREUM_SEPOLIA.receivePattern,
  );
  static readonly ETC = new Currency(
    "Ethereum Classic",
    "ETC",
    AppInfos.ETHEREUM_CLASSIC.name,
    AppInfos.ETHEREUM_CLASSIC.sendPattern,
    AppInfos.ETHEREUM_CLASSIC.receivePattern,
  );
  static readonly SOL = new Currency(
    "Solana",
    "SOL",
    AppInfos.SOLANA.name,
    AppInfos.SOLANA.sendPattern,
    AppInfos.SOLANA.receivePattern,
  );

  static readonly DOT = new Currency(
    "Polkadot",
    "DOT",
    AppInfos.POLKADOT.name,
    AppInfos.POLKADOT.sendPattern,
    AppInfos.POLKADOT.receivePattern,
  );
  static readonly TRX = new Currency(
    "Tron",
    "TRX",
    AppInfos.TRON.name,
    AppInfos.TRON.sendPattern,
    AppInfos.TRON.receivePattern,
  );
  static readonly XRP = new Currency(
    "XRP",
    "XRP",
    AppInfos.RIPPLE.name,
    AppInfos.RIPPLE.sendPattern,
    AppInfos.RIPPLE.receivePattern,
  );
  static readonly ADA = new Currency(
    "Cardano",
    "ADA",
    AppInfos.CARDANO.name,
    AppInfos.CARDANO.sendPattern,
    AppInfos.CARDANO.receivePattern,
  );
  static readonly XLM = new Currency(
    "Stellar",
    "XLM",
    AppInfos.STELLAR.name,
    AppInfos.STELLAR.sendPattern,
    AppInfos.STELLAR.receivePattern,
  );
  static readonly BCH = new Currency(
    "Bitcoin Cash",
    "BCH",
    AppInfos.BITCOIN_CASH.name,
    AppInfos.BITCOIN_CASH.sendPattern,
    AppInfos.BITCOIN_CASH.receivePattern,
  );
  static readonly ALGO = new Currency(
    "Algorand",
    "ALGO",
    AppInfos.ALGORAND.name,
    AppInfos.ALGORAND.sendPattern,
    AppInfos.ALGORAND.receivePattern,
  );
  static readonly ATOM = new Currency(
    "Cosmos",
    "ATOM",
    AppInfos.COSMOS.name,
    AppInfos.COSMOS.sendPattern,
    AppInfos.COSMOS.receivePattern,
  );
  static readonly XTZ = new Currency(
    "Tezos",
    "XTZ",
    AppInfos.TEZOS.name,
    AppInfos.TEZOS.sendPattern,
    AppInfos.TEZOS.receivePattern,
  );
  static readonly MATIC = new Currency(
    "Polygon",
    "MATIC",
    AppInfos.POLYGON.name,
    AppInfos.POLYGON.sendPattern,
    AppInfos.POLYGON.receivePattern,
  );
  static readonly BSC = new Currency(
    "Binance Smart Chain",
    "BNB",
    AppInfos.BINANCE_SMART_CHAIN.name,
    AppInfos.BINANCE_SMART_CHAIN.sendPattern,
    AppInfos.BINANCE_SMART_CHAIN.receivePattern,
  );
  static readonly TON = new Currency(
    "Ton",
    "TON",
    AppInfos.TON.name,
    AppInfos.TON.sendPattern,
    AppInfos.TON.receivePattern,
  );
  static readonly ETH_USDT = new Currency(
    "Tether USD",
    "USDT",
    AppInfos.ETHEREUM.name,
    AppInfos.ETHEREUM.sendPattern,
    AppInfos.ETHEREUM.receivePattern,
  );
  static readonly ETH_LIDO = new Currency(
    "LIDO Staked ETH",
    "STETH",
    AppInfos.ETHEREUM.name,
    AppInfos.ETHEREUM.sendPattern,
    AppInfos.ETHEREUM.receivePattern,
  );
  static readonly XLM_USCD = new Currency(
    "USDC",
    "usdc",
    AppInfos.STELLAR.name,
    AppInfos.STELLAR.sendPattern,
    AppInfos.STELLAR.receivePattern,
  );
  static readonly ALGO_USDT = new Currency(
    "Tether USDt",
    "USDT",
    AppInfos.ALGORAND.name,
    AppInfos.ALGORAND.sendPattern,
    AppInfos.ALGORAND.receivePattern,
  );
  static readonly TRX_USDT = new Currency(
    "Tether USD",
    "USDT",
    AppInfos.TRON.name,
    AppInfos.TRON.sendPattern,
    AppInfos.TRON.receivePattern,
  );
  static readonly TRX_BTT = new Currency(
    "BitTorrent",
    "BTT",
    AppInfos.TRON.name,
    AppInfos.TRON.sendPattern,
    AppInfos.TRON.receivePattern,
  );
  static readonly BSC_BUSD = new Currency(
    "Binance-Peg BUSD Token",
    "BUSD",
    AppInfos.BINANCE_SMART_CHAIN.name,
    AppInfos.BINANCE_SMART_CHAIN.sendPattern,
    AppInfos.BINANCE_SMART_CHAIN.receivePattern,
  );
  static readonly BSC_SHIBA = new Currency(
    "Shiba Inu",
    "SHIB",
    AppInfos.BINANCE_SMART_CHAIN.name,
    AppInfos.BINANCE_SMART_CHAIN.sendPattern,
    AppInfos.BINANCE_SMART_CHAIN.receivePattern,
  );
  static readonly MATIC_DAI = new Currency(
    "(PoS) Dai Stablecoin",
    "DAI",
    AppInfos.POLYGON.name,
    AppInfos.POLYGON.sendPattern,
    AppInfos.POLYGON.receivePattern,
  );
  static readonly MATIC_UNI = new Currency(
    "Uniswap (PoS)",
    "UNI",
    AppInfos.POLYGON.name,
    AppInfos.POLYGON.sendPattern,
    AppInfos.POLYGON.receivePattern,
  );
}
