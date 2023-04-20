import CosmosBase from "./cosmosBase";

class Nyx extends CosmosBase {
  stakingDocUrl: string;
  unbondingPeriod: number;
  validatorPrefix: string;
  prefix: string;
  // Provided by coin config
  lcd!: string;
  ledgerValidator!: string;
  constructor() {
    super();
    this.lcd = "https://api.nyx.nodes.guru";
    this.stakingDocUrl =
      "https://support.ledger.com/hc/en-us/articles/9604704817821?support=true";
    this.unbondingPeriod = 28;
    this.prefix = "n";
    this.validatorPrefix = `${this.prefix}valoper`;
    this.minGasprice = 0.25;
  }
}

export default Nyx;
