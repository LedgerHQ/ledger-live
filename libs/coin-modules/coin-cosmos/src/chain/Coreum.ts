import CosmosBase from "./cosmosBase";

class Coreum extends CosmosBase {
  stakingDocUrl: string;
  unbondingPeriod: number;
  validatorPrefix: string;
  prefix: string;
  // Provided by coin config
  lcd!: string;
  ledgerValidator!: string;
  constructor() {
    super();
    this.stakingDocUrl = "https://support.ledger.com/article/12562984791837-zd?redirect=false";
    this.unbondingPeriod = 7;
    this.prefix = "core";
    this.validatorPrefix = `${this.prefix}valoper`;
  }
}

export default Coreum;
