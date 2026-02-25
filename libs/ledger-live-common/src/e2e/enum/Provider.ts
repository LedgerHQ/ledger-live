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
  static readonly VELORA = new Provider("velora", "Velora", false, false, true);
  static readonly MOONPAY = new Provider("moonpay", "MoonPay", true, false, true);
  //TODO: THORCHAIN is actually kyc: false but due to the speculos crashing with native flow the bug needs to be fixed first before activating
  //and adapting the flow accordingly
  static readonly THORCHAIN = new Provider("thorswap", "THORChain", true, true, false);
  static readonly UNISWAP = new Provider("uniswap", "Uniswap", false, false, false);
  static readonly LIFI = new Provider("lifi", "LI.FI", false, true, false);
  static readonly CIC = new Provider("cic", "CIC", false, true, true);
  static readonly COINBASE = new Provider("coinbase", "Coinbase", false, true, true);
  static readonly KILN = new Provider("kiln_pooling", "Kiln staking Pool", false, true, true);
  static readonly STADER_LABS = new Provider("stader-eth", "Stader Labs", false, true, true);
  static readonly LIDO = new Provider("lido", "Lido", false, true, true);
  static readonly TRANSAK = new Provider("transak", "Transak", false, true, true);
  static readonly NEAR_INTENTS = new Provider("nearintents", "NEAR Intents", false, true, true);

  static getNameByUiName(uiName: string): string {
    const provider = Object.values(Provider).find(p => p.uiName === uiName);
    return provider ? provider.name : "";
  }
}

export enum Rate {
  FIXED = "fixed",
  FLOAT = "float",
}
