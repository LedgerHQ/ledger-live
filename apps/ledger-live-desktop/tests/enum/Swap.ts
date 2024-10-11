export class Provider {
  constructor(
    public readonly name: string,
    public readonly uiName: string,
  ) {}
  static readonly CHANGELLY = new Provider("changelly", "Changelly");
  static readonly ONEINCH = new Provider("oneinch", "1inch");
}

export enum Rates {
  FIXED = "fixed",
  FLOAT = "float",
}
