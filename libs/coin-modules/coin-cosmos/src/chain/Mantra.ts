import CosmosBase from "./cosmosBase";

class Mantra extends CosmosBase {
  stakingDocUrl: string;
  unbondingPeriod: number;
  prefix: string;
  validatorPrefix: string;
  // Provided by coin config
  ledgerValidator!: string;
  lcd!: string;
  constructor() {
    super();
    this.stakingDocUrl = "https://support.ledger.com/article/Mantra-OM";
    this.unbondingPeriod = 21;
    this.prefix = "mantra";
    this.validatorPrefix = `${this.prefix}valoper`;
  }
}

export default Mantra;
