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
    this.stakingDocUrl = "https://support.ledger.com/hc/articles/14553855333533?docs=true";
    this.unbondingPeriod = 21;
    this.prefix = "dydx";
    this.validatorPrefix = `${this.prefix}valoper`;
  }
}

export default Dydx;
