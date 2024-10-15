export class Provider {
  constructor(
    public readonly name: string,
    public readonly uiName: string,
  ) {}
  static readonly CHANGELLY = new Provider("changelly", "Changelly");
  static readonly ONEINCH = new Provider("oneinch", "1inch");
  static readonly EXODUS = new Provider("exodus", "Exodus");
  static readonly THORSWAP = new Provider("thorswap", "THORSwap");
}

export enum Rate {
  FIXED = "fixed",
  FLOAT = "float",
}
