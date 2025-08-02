import CosmosBase from "./cosmosBase";

export default class Babylon extends CosmosBase {
  stakingDocUrl: string;
  unbondingPeriod: number;
  prefix: string;
  validatorPrefix: string;
  // Provided by coin config
  ledgerValidator!: string;
  lcd!: string;
  constructor() {
    super();
    this.stakingDocUrl = "https://www.allnodes.com/lunc/stake";
    this.unbondingPeriod = 21;
    this.prefix = "terra";
    this.validatorPrefix = `${this.prefix}valoper`;
  }
}
