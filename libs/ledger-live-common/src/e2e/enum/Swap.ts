export class Provider {
  constructor(
    public readonly name: string,
    public readonly uiName: string,
    public readonly kyc: boolean,
    public readonly isNative: boolean,
  ) {}
  static readonly CHANGELLY = new Provider("changelly", "Changelly", false, true);
  static readonly EXODUS = new Provider("exodus", "Exodus", false, true);
  static readonly ONE_INCH = new Provider("oneinch", "1inch", false, false);
  static readonly PARASWAP = new Provider("paraswap", "Paraswap", false, false);
  static readonly MOONPAY = new Provider("moonpay", "MoonPay", true, false);
  static readonly THORCHAIN = new Provider("thorswap", "THORChain", false, true);
  static readonly UNISWAP = new Provider("uniswap", "Uniswap", false, false);
}

export enum Rate {
  FIXED = "fixed",
  FLOAT = "float",
}
