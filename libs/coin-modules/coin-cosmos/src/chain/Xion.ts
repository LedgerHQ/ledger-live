import CosmosBase from "./cosmosBase";

class Xion extends CosmosBase {
  stakingDocUrl: string;
  unbondingPeriod: number;
  prefix: string;
  validatorPrefix: string;
  // Provided by coin config
  ledgerValidator!: string;
  lcd!: string;
  constructor() {
    super();
    this.stakingDocUrl = "";
    this.unbondingPeriod = 21;
    this.prefix = "xion";
    this.validatorPrefix = `${this.prefix}valoper`;
  }
}

export default Xion;
