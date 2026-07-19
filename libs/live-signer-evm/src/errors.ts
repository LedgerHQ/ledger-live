export class EthAppPleaseEnableContractData extends Error {
  override name = "EthAppPleaseEnableContractData";
  constructor(message?: string) {
    super(message ?? "EthAppPleaseEnableContractData");
  }
}
