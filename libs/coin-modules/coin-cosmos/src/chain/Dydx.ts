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
    this.stakingDocUrl = "https://support.ledger.com/article/14553855333533-zd";
    this.unbondingPeriod = 30;
    this.prefix = "dydx";
    this.validatorPrefix = `${this.prefix}valoper`;
  }
}

export default Dydx;
