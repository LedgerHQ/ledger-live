import CosmosBase from "./cosmosBase";

class Stride extends CosmosBase {
  lcd!: string;
  stakingDocUrl: string;
  unbondingPeriod: number;
  ledgerValidator!: string;
  validatorPrefix: string;
  prefix: string;

  constructor() {
    super();
    this.stakingDocUrl =
      "https://support.ledger.com/hc/en-us/articles/9604429835421?support=true";
    this.unbondingPeriod = 28;
    this.prefix = "stride";
    this.validatorPrefix = `${this.prefix}valoper`;
  }
}

export default Stride;
