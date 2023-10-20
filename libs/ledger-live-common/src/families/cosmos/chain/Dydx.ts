import CosmosBase from "./cosmosBase";

class Dydx extends CosmosBase {
  stakingDocUrl: string;
  unbondingPeriod: number;
  validatorPrefix: string;
  prefix: string;
  // Provided by coin config
  lcd!: string;
  ledgerValidator!: string;
  constructor() {
    super();
    this.stakingDocUrl = "https://support.ledger.com/hc/en-us/articles/9604865330717?support=true";
    this.unbondingPeriod = 21;
    this.prefix = "dydx";
    this.validatorPrefix = `${this.prefix}valoper`;
  }
}

export default Dydx;
