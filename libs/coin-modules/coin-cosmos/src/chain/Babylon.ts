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
    this.stakingDocUrl = "";
    this.unbondingPeriod = 2;
    this.prefix = "bbn";
    this.validatorPrefix = `${this.prefix}valoper`;
  }
}
