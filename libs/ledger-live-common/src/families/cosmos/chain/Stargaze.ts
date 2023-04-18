import CosmosBase from "./cosmosBase";

class Stargaze extends CosmosBase {
  lcd!: string;
  stakingDocUrl: string;
  unbondingPeriod: number;
  ledgerValidator!: string;
  validatorPrefix: string;
  prefix: string;

  constructor() {
    super();
    this.stakingDocUrl =
      "https://support.ledger.com/hc/en-us/articles/9604638272669?support=true;";
    this.unbondingPeriod = 28;
    this.prefix = "stars";
    this.validatorPrefix = `${this.prefix}valoper`;
  }
}

export default Stargaze;
