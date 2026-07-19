export class EthAppPleaseEnableContractData extends Error {
  override name = "EthAppPleaseEnableContractData";
  constructor(message?: string) {
    super(message ?? "EthAppPleaseEnableContractData");
  }
}
export class EthAppNftNotSupported extends Error {
  override name = "EthAppNftNotSupported";
  constructor(message?: string) {
    super(message ?? "EthAppNftNotSupported");
  }
}
export class CeloAppPleaseEnableContractData extends Error {
  override name = "CeloAppPleaseEnableContractData";
  constructor(message?: string) {
    super(message ?? "CeloAppPleaseEnableContractData");
  }
}
