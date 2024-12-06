import CosmosBase from "./cosmosBase";

class Osmosis extends CosmosBase {
  stakingDocUrl: string;
  unbondingPeriod: number;
  validatorPrefix: string;
  prefix: string;
  // Provided by coin config
  lcd!: string;
  ledgerValidator!: string;
  constructor() {
    super();
    this.prefix = "osmo";
    this.unbondingPeriod = 14;
    this.stakingDocUrl = "https://support.ledger.com/article/6235986236957-zd";
    this.validatorPrefix = `${this.prefix}valoper`;
  }
}

export default Osmosis;
