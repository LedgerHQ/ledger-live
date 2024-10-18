export class Provider {
  constructor(
    public readonly name: string,
    public readonly uiName: string,
  ) {}
  static readonly CHANGELLY = new Provider("changelly", "Changelly");
  static readonly EXODUS = new Provider("exodus", "Exodus");
}

export enum Rate {
  FIXED = "fixed",
  FLOAT = "float",
}
