export class Provider {
  constructor(
    public readonly name: string,
    public readonly uiName: string,
    public readonly kyc: boolean,
    public readonly isNative: boolean,
    public readonly availableOnLns: boolean,
  ) {}
  static readonly CHANGELLY = new Provider("changelly", "Changelly", false, true, true);
  static readonly EXODUS = new Provider("exodus", "Exodus", false, true, true);
  static readonly ONE_INCH = new Provider("oneinch", "1inch", false, false, true);
  static readonly PARASWAP = new Provider("paraswap", "Paraswap", false, false, true);
  static readonly MOONPAY = new Provider("moonpay", "MoonPay", true, false, true);
  static readonly THORCHAIN = new Provider("thorswap", "THORChain", false, true, false);
  static readonly UNISWAP = new Provider("uniswap", "Uniswap", false, false, false);
  static readonly LIFI = new Provider("lifi", "LI.FI", false, true, false);
  static readonly CIC = new Provider("cic", "CIC", false, true, true);
  static readonly COINBASE = new Provider("coinbase", "Coinbase", false, true, true);

  static getNameByUiName(uiName: string): string {
    const provider = Object.values(Provider).find(p => p.uiName === uiName);
    return provider ? provider.name : "";
  }
}

export enum Rate {
  FIXED = "fixed",
  FLOAT = "float",
}
