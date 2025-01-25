import CosmosBase from "./cosmosBase";

class SeiNetwork extends CosmosBase {
  lcd!: string;
  ledgerValidator!: string;
  stakingDocUrl: string;
  unbondingPeriod: number;
  validatorPrefix: string;
  prefix: string;

  constructor() {
    super();
    this.stakingDocUrl = "https://support.ledger.com/article/6235986236957-zd";
    this.unbondingPeriod = 28;
    this.prefix = "sei";
    this.validatorPrefix = `${this.prefix}valoper`;
  }
}

export default SeiNetwork;
