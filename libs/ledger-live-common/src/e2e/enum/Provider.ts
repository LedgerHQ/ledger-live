import { AppInfos } from "./AppInfos";

export abstract class BaseProvider {
  constructor(
    public readonly name: string,
    public readonly uiName: string,
  ) {}

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

export class SwapProvider extends BaseProvider {
  constructor(
    name: string,
    uiName: string,
    public readonly kyc: boolean,
    public readonly availableOnLns: boolean,
    public readonly contractAddress?: string,
    public readonly app?: AppInfos,
  ) {
    super(name, uiName);
  }

  static readonly CHANGELLY = new SwapProvider("changelly_v2", "Changelly", false, true);
  static readonly EXODUS = new SwapProvider("exodus", "Exodus", false, true);
  static readonly MOONPAY = new SwapProvider("moonpay", "MoonPay", true, true);
  static readonly CIC = new SwapProvider("cic_v2", "CIC", false, true);
  static readonly NEAR_INTENTS = new SwapProvider("nearintents", "NEAR Intents", false, true);
  static readonly SWAPSXYZ = new SwapProvider("swapsxyz", "Swaps.xyz", false, true);
  static readonly MOONPAY_TRADE = new SwapProvider("moonpay_trade", "MoonPay Trade", false, true);

  static readonly THORCHAIN = new SwapProvider(
    "thorswap",
    "THORChain",
    false,
    false,
    "0xD37BbE5744D730a1d98d8DC97c42F0Ca46aD7146",
  );
  static readonly LIFI = new SwapProvider(
    "lifi",
    "LI.FI",
    false,
    false,
    "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  );

  static readonly UNISWAP = new SwapProvider(
    "uniswap",
    "Uniswap",
    false,
    false,
    "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    AppInfos.ETHEREUM,
  );

  static readonly ONE_INCH = new SwapProvider(
    "oneinch",
    "1inch",
    false,
    true,
    "0x111111125421cA6dc452d289314280a0f8842A65",
    AppInfos.ONE_INCH,
  );
  static readonly VELORA = new SwapProvider(
    "velora",
    "Velora",
    false,
    true,
    "0x6A000F20005980200259B80c5102003040001068",
    AppInfos.VELORA,
  );
  static readonly OKX = new SwapProvider(
    "okx",
    "OKX",
    false,
    false,
    "0x40aA958dd87FC8305b97f2BA922CDdCa374bcD7f",
    AppInfos.ETHEREUM,
  );
}

export class EarnProvider extends BaseProvider {
  static readonly KILN = new EarnProvider("kiln_pooling", "Kiln staking Pool");
  static readonly STADER_LABS = new EarnProvider("stader-eth", "Stader Labs");
  static readonly LIDO = new EarnProvider("lido", "Lido");
}

export class BuySellProvider extends BaseProvider {
  constructor(
    name: string,
    uiName: string,
    public readonly isTested: boolean,
  ) {
    super(name, uiName);
  }

  static readonly MOONPAY = new BuySellProvider("moonpay", "MoonPay", true);
  static readonly REVOLUT = new BuySellProvider("revolut", "Revolut", true);
  static readonly MERCURYO = new BuySellProvider("mercuryo", "Mercuryo", true);
  static readonly TRANSAK = new BuySellProvider("transak", "Transak", true);
  static readonly TOPPER = new BuySellProvider("topper", "Topper", true);
  static readonly COINBASE = new BuySellProvider("coinbase", "Coinbase", true);
  static readonly COINIFY = new BuySellProvider("coinify-buy", "Coinify", true);
  static readonly RAMP_NETWORK = new BuySellProvider("ramp", "Ramp Network", true);
  static readonly BTC_DIRECT = new BuySellProvider("btc_direct", "BTC Direct", true);
  static readonly SARDINE = new BuySellProvider("sardine", "Sardine", true);
  static readonly SIMPLEX = new BuySellProvider("simplex", "Simplex", true);
  static readonly BANXA = new BuySellProvider("banxa", "Banxa", true);
  static readonly YOU_HODLER = new BuySellProvider("youhodler", "YouHodler", true);
  static readonly ALCHEMY_PAY = new BuySellProvider("alchemypay", "Alchemy Pay", true);
  static readonly CRYPTO_COM = new BuySellProvider("cryptocom", "Crypto.com", true);
  static readonly PAYPAL = new BuySellProvider("paypal", "PayPal", false);
}

export enum Rate {
  FIXED = "fixed",
  FLOAT = "float",
}
