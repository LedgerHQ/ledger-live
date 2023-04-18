import CosmosBase from "./cosmosBase";

class Onomy extends CosmosBase {
  lcd!: string;
  stakingDocUrl: string;
  unbondingPeriod: number;
  ledgerValidator!: string;
  prefix: string;
  validatorPrefix: string;

  constructor() {
    super();
    this.stakingDocUrl =
      "https://support.ledger.com/hc/en-us/articles/9604211307933?support=true";
    this.unbondingPeriod = 28;
    this.prefix = "onomy";
    this.validatorPrefix = `${this.prefix}valoper`;
  }
}

export default Onomy;
