import CosmosBase from "./cosmosBase";

class Cosmos extends CosmosBase {
  stakingDocUrl: string;
  unbondingPeriod: number;
  prefix: string;
  validatorPrefix: string;
  // Provided by coin config
  lcd!: string;
  ledgerValidator!: string;
  constructor() {
    super();
    this.unbondingPeriod = 21;
    this.stakingDocUrl = "https://support.ledger.com/article/360014339340-zd";
    this.prefix = "cosmos";
    this.validatorPrefix = this.prefix + "valoper";
  }
}

export default Cosmos;
