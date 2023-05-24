import CosmosBase from "./cosmosBase";

class SecretNetwork extends CosmosBase {
  lcd!: string;
  stakingDocUrl: string;
  unbondingPeriod: number;
  ledgerValidator!: string;
  validatorPrefix: string;
  prefix: string;

  constructor() {
    super();
    this.stakingDocUrl =
      "https://support.ledger.com/hc/en-us/articles/9604764378781?support=true";
    this.unbondingPeriod = 28;
    this.prefix = "secret";
    this.validatorPrefix = `${this.prefix}valoper`;
  }
}

export default SecretNetwork;
