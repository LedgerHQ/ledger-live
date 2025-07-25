import CosmosBase from "./cosmosBase";

class Terraclassic extends CosmosBase {
  stakingDocUrl: string;
  unbondingPeriod: number;
  prefix: string;
  validatorPrefix: string;
  // Provided by coin config
  ledgerValidator!: string;
  lcd!: string;
  constructor() {
    super();
    this.stakingDocUrl =
      "https://support.ledger.com/hc/en-us/articles/9603789661085-zd?support=true";
    this.unbondingPeriod = 21;
    this.prefix = "terra";
    this.validatorPrefix = `${this.prefix}valoper`;
  }
}

export default Axelar;
