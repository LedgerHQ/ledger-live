import CosmosBase from "./cosmosBase";

class CryptoOrg extends CosmosBase {
  stakingDocUrl: string;
  unbondingPeriod: number;
  validatorPrefix: string;
  prefix: string;
  // Served by the "Cronos POS Chain" app on coin type 394, not by app-cosmos — whose chain
  // config has no "cro" entry and whose isSupportedCoinType() admits only 118, 60 and its own
  // table. That app's handling of the prefix field on the sign APDU is unverified, so keep
  // omitting it: the signed digest is unaffected, only the APDU framing would change.
  signWithPrefix = false;
  // Provided by coin config
  lcd!: string;
  ledgerValidator!: string;
  constructor() {
    super();
    this.stakingDocUrl = "";
    this.unbondingPeriod = 28;
    this.prefix = "cro";
    this.validatorPrefix = `${this.prefix}cncl`;
  }
}

export default CryptoOrg;
