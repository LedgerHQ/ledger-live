import { AppInfos } from "./AppInfos";

export class Provider {
  constructor(
    public readonly name: string,
    public readonly uiName: string,
    public readonly kyc: boolean,
    public readonly isNative: boolean,
    public readonly availableOnLns: boolean,
    public readonly contractAddress?: string,
    public readonly app?: AppInfos,
  ) {}
  // Swap providers
  static readonly CHANGELLY = new Provider("changelly", "Changelly", false, true, true);
  static readonly EXODUS = new Provider("exodus", "Exodus", false, true, true);
  static readonly MOONPAY = new Provider("moonpay", "MoonPay", true, false, true);
  static readonly CIC = new Provider("cic", "CIC", false, true, true);
  static readonly NEAR_INTENTS = new Provider("nearintents", "NEAR Intents", false, true, true);
  static readonly SWAPSXYZ = new Provider("swapsxyz", "Swaps.xyz", false, true, true);

  static readonly THORCHAIN = new Provider(
    "thorswap",
    "THORChain",
    false,
    true,
    false,
    "0xD37BbE5744D730a1d98d8DC97c42F0Ca46aD7146",
  );
  static readonly LIFI = new Provider(
    "lifi",
    "LI.FI",
    false,
    true,
    false,
    "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  );

  static readonly UNISWAP = new Provider(
    "uniswap",
    "Uniswap",
    false,
    false,
    false,
    "0x000000000022D473030F116dDEE9F6B43aC78BA3",
  );

  static readonly ONE_INCH = new Provider(
    "oneinch",
    "1inch",
    false,
    false,
    true,
    "0x111111125421cA6dc452d289314280a0f8842A65",
    AppInfos.ONE_INCH,
  );
  static readonly VELORA = new Provider(
    "velora",
    "Velora",
    false,
    false,
    true,
    "0x6A000F20005980200259B80c5102003040001068",
    AppInfos.VELORA,
  );
  static readonly OKX = new Provider(
    "okx",
    "OKX",
    false,
    true,
    false,
    "0x40aA958dd87FC8305b97f2BA922CDdCa374bcD7f",
    AppInfos.ETHEREUM,
  );

  // Earn providers
  static readonly KILN = new Provider("kiln_pooling", "Kiln staking Pool", true, true, true);
  static readonly STADER_LABS = new Provider("stader-eth", "Stader Labs", true, true, true);
  static readonly LIDO = new Provider("lido", "Lido", true, true, true);

  static getNameByUiName(uiName: string): string {
    const provider = Object.values(Provider).find(p => p.uiName === uiName);
    return provider?.name ?? "";
  }
}

export class BuySellProvider {
  constructor(
    public readonly name: string,
    public readonly uiName: string,
    public readonly isTested: boolean,
  ) {}
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

  static getByUiName(uiName: string): BuySellProvider {
    return Object.values(BuySellProvider).find(p => p.uiName === uiName);
  }

  static getNameByUiName(uiName: string): string {
    return BuySellProvider.getByUiName(uiName).name;
  }
}

export enum Rate {
  FIXED = "fixed",
  FLOAT = "float",
}
