import { AppInfos } from "./AppInfos";

type BaseProviderOptions = {
  name: string;
  uiName: string;
};

export abstract class BaseProvider {
  public readonly name: string;
  public readonly uiName: string;

  constructor(options: BaseProviderOptions) {
    this.name = options.name;
    this.uiName = options.uiName;
  }

  static getByUiName<T extends BaseProvider>(
    this: abstract new (...args: never[]) => T,
    uiName: string,
  ): T | undefined {
    return Object.values(this).find(
      (p): p is T => p instanceof BaseProvider && p.uiName === uiName,
    );
  }

  static getNameByUiName<T extends BaseProvider>(
    this: (abstract new (...args: never[]) => T) & { getByUiName(uiName: string): T | undefined },
    uiName: string,
  ): string {
    return this.getByUiName(uiName)?.name ?? "";
  }
}

type SwapProviderOptions = BaseProviderOptions & {
  kyc: boolean;
  availableOnLns: boolean;
  contractAddress?: string;
  app?: AppInfos;
  amountAlwaysShownOnDevice?: boolean;
};

export class SwapProvider extends BaseProvider {
  public readonly kyc: boolean;
  public readonly availableOnLns: boolean;
  public readonly contractAddress?: string;
  public readonly app?: AppInfos;
  public readonly amountAlwaysShownOnDevice: boolean;

  constructor(options: SwapProviderOptions) {
    super(options);
    this.kyc = options.kyc;
    this.availableOnLns = options.availableOnLns;
    this.contractAddress = options.contractAddress;
    this.app = options.app;
    this.amountAlwaysShownOnDevice = options.amountAlwaysShownOnDevice ?? true;
  }

  // TODO: re-enable once Changelly provider is re-enabled
  //static readonly CHANGELLY = new SwapProvider({ name: "changelly_v2", uiName: "Changelly", kyc: false, availableOnLns: true });
  static readonly EXODUS = new SwapProvider({
    name: "exodus",
    uiName: "Exodus",
    kyc: false,
    availableOnLns: true,
  });
  static readonly MOONPAY = new SwapProvider({
    name: "moonpay",
    uiName: "MoonPay",
    kyc: true,
    availableOnLns: true,
  });
  static readonly CIC = new SwapProvider({
    name: "cic_v2",
    uiName: "CIC",
    kyc: false,
    availableOnLns: true,
  });
  static readonly NEAR_INTENTS = new SwapProvider({
    name: "nearintents",
    uiName: "NEAR Intents",
    kyc: false,
    availableOnLns: true,
  });
  static readonly SWAPSXYZ = new SwapProvider({
    name: "swapsxyz",
    uiName: "Swaps.xyz",
    kyc: false,
    availableOnLns: true,
  });
  static readonly MOONPAY_TRADE = new SwapProvider({
    name: "moonpay_trade",
    uiName: "MoonPay Trade",
    kyc: false,
    availableOnLns: true,
  });

  static readonly THORCHAIN = new SwapProvider({
    name: "thorswap",
    uiName: "THORChain",
    kyc: false,
    availableOnLns: false,
    contractAddress: "0xD37BbE5744D730a1d98d8DC97c42F0Ca46aD7146",
  });
  static readonly LIFI = new SwapProvider({
    name: "lifi",
    uiName: "LI.FI",
    kyc: false,
    availableOnLns: false,
    contractAddress: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  });

  static readonly UNISWAP = new SwapProvider({
    name: "uniswap",
    uiName: "Uniswap",
    kyc: false,
    availableOnLns: false,
    contractAddress: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    app: AppInfos.ETHEREUM,
  });

  static readonly ONE_INCH = new SwapProvider({
    name: "oneinch",
    uiName: "1inch",
    kyc: false,
    availableOnLns: true,
    contractAddress: "0x111111125421cA6dc452d289314280a0f8842A65",
    app: AppInfos.ONE_INCH,
  });
  static readonly VELORA = new SwapProvider({
    name: "velora",
    uiName: "Velora",
    kyc: false,
    availableOnLns: true,
    contractAddress: "0x6A000F20005980200259B80c5102003040001068",
    app: AppInfos.VELORA,
  });
  static readonly OKX = new SwapProvider({
    name: "okx",
    uiName: "OKX",
    kyc: false,
    availableOnLns: false,
    contractAddress: "0x40aA958dd87FC8305b97f2BA922CDdCa374bcD7f",
    app: AppInfos.ETHEREUM,
    // OKX router review may omit the amount (accepted by product)
    amountAlwaysShownOnDevice: false,
  });
}

export class EarnProvider extends BaseProvider {
  static readonly KILN = new EarnProvider({ name: "kiln_pooling", uiName: "Kiln staking Pool" });
  static readonly STADER_LABS = new EarnProvider({ name: "stader-eth", uiName: "Stader Labs" });
  static readonly LIDO = new EarnProvider({ name: "lido", uiName: "Lido" });
}

export class PerpsProvider extends BaseProvider {
  static readonly SWAPKIT = new PerpsProvider({ name: "swapkit_hyperliquid", uiName: "SwapKit" });
}

type BuySellProviderOptions = BaseProviderOptions & {
  isTested: boolean;
};

export class BuySellProvider extends BaseProvider {
  public readonly isTested: boolean;

  constructor(options: BuySellProviderOptions) {
    super(options);
    this.isTested = options.isTested;
  }

  static readonly MOONPAY = new BuySellProvider({
    name: "moonpay",
    uiName: "MoonPay",
    isTested: true,
  });
  static readonly REVOLUT = new BuySellProvider({
    name: "revolut",
    uiName: "Revolut",
    isTested: true,
  });
  static readonly MERCURYO = new BuySellProvider({
    name: "mercuryo",
    uiName: "Mercuryo",
    isTested: true,
  });
  static readonly TRANSAK = new BuySellProvider({
    name: "transak",
    uiName: "Transak",
    isTested: true,
  });
  static readonly TOPPER = new BuySellProvider({
    name: "topper",
    uiName: "Topper",
    isTested: true,
  });
  static readonly COINBASE = new BuySellProvider({
    name: "coinbase",
    uiName: "Coinbase",
    isTested: true,
  });
  static readonly COINIFY = new BuySellProvider({
    name: "coinify-buy",
    uiName: "Coinify",
    isTested: true,
  });
  static readonly RAMP_NETWORK = new BuySellProvider({
    name: "ramp",
    uiName: "Ramp Network",
    isTested: true,
  });
  static readonly BTC_DIRECT = new BuySellProvider({
    name: "btcdirect",
    uiName: "BTC Direct",
    isTested: true,
  });
  static readonly SARDINE = new BuySellProvider({
    name: "sardine",
    uiName: "Sardine",
    isTested: true,
  });
  static readonly SIMPLEX = new BuySellProvider({
    name: "simplex",
    uiName: "Simplex",
    isTested: true,
  });
  static readonly BANXA = new BuySellProvider({ name: "banxa", uiName: "Banxa", isTested: true });
  static readonly YOU_HODLER = new BuySellProvider({
    name: "youhodler",
    uiName: "YouHodler",
    isTested: true,
  });
  static readonly ALCHEMY_PAY = new BuySellProvider({
    name: "alchemypay",
    uiName: "Alchemy Pay",
    isTested: true,
  });
  static readonly CRYPTO_COM = new BuySellProvider({
    name: "cryptocom",
    uiName: "Crypto.com",
    isTested: true,
  });
  static readonly PAYPAL = new BuySellProvider({
    name: "paypal",
    uiName: "PayPal",
    isTested: false,
  });
}

export enum Rate {
  FIXED = "fixed",
  FLOAT = "float",
}
