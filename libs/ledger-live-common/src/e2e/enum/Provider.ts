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
    AppInfos.ETHEREUM,
  );
  static readonly VELORA = new Provider(
    "velora",
    "Velora",
    false,
    false,
    true,
    "0x6A000F20005980200259B80c5102003040001068",
    AppInfos.ETHEREUM,
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

  // Buy And Sell providers
  static readonly REVOLUT = new Provider("revolut", "Revolut", true, true, true);
  static readonly MERCURYO = new Provider("mercuryo", "Mercuryo", true, true, true);
  static readonly TRANSAK = new Provider("transak", "Transak", true, true, true);
  static readonly TOPPER = new Provider("topper", "Topper", true, true, true);
  static readonly COINBASE = new Provider("coinbase", "Coinbase", true, true, true);
  static readonly COINIFY = new Provider("coinify-buy", "Coinify", true, true, true);
  static readonly RAMP_NETWORK = new Provider("ramp", "Ramp Network", true, true, true);
  static readonly BTC_DIRECT = new Provider("btc_direct", "BTC Direct", true, true, true);
  static readonly SARDINE = new Provider("sardine", "Sardine", true, true, true);
  static readonly SIMPLEX = new Provider("simplex", "Simplex", true, true, true);
  static readonly BANXA = new Provider("banxa", "Banxa", true, true, true);
  static readonly YOU_HODLER = new Provider("youhodler", "YouHodler", true, true, true);
  static readonly ALCHEMY_PAY = new Provider("alchemypay", "Alchemy Pay", true, true, true);
  static readonly CRYPTO_COM = new Provider("cryptocom", "Crypto.com", true, true, true);

  // Earn providers
  static readonly KILN = new Provider("kiln_pooling", "Kiln staking Pool", true, true, true);
  static readonly STADER_LABS = new Provider("stader-eth", "Stader Labs", true, true, true);
  static readonly LIDO = new Provider("lido", "Lido", true, true, true);

  static getNameByUiName(uiName: string): string {
    const provider = Object.values(Provider).find(p => p.uiName === uiName);
    return provider ? provider.name : "";
  }
}

export enum Rate {
  FIXED = "fixed",
  FLOAT = "float",
}
