import CosmosBase from "./cosmosBase";

class CryptoOrg extends CosmosBase {
  stakingDocUrl: string;
  unbondingPeriod: number;
  validatorPrefix: string;
  prefix: string;
  // Provided by coin config
  lcd!: string;
  ledgerValidator!: string;
  constructor() {
    super();
    this.stakingDocUrl = "";
    this.unbondingPeriod = 28;
    this.prefix = "cro";
    this.validatorPrefix = `${this.prefix}valoper`;
  }
}

export default CryptoOrg;
