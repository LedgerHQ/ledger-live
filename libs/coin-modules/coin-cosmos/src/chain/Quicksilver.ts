import CosmosBase from "./cosmosBase";

class Quicksilver extends CosmosBase {
  lcd!: string;
  stakingDocUrl: string;
  unbondingPeriod: number;
  ledgerValidator!: string;
  validatorPrefix: string;
  prefix: string;

  constructor() {
    super();
    this.stakingDocUrl =
      "https://support.ledger.com/hc/en-us/articles/9604308344221-zd?support=true";
    this.unbondingPeriod = 21;
    this.prefix = "quick";
    this.validatorPrefix = `${this.prefix}valoper`;
  }
}

export default Quicksilver;
