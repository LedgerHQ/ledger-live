import CosmosBase from "./cosmosBase";

class BinanceBeaconChain extends CosmosBase {
  stakingDocUrl: string;
  unbondingPeriod: number;
  validatorPrefix: string;
  prefix: string;
  // Provided by coin config
  lcd!: string;
  ledgerValidator!: string;
  constructor() {
    super();
    this.stakingDocUrl = "https://support.ledger.com/hc/en-us/articles/9605007135133?support=true";
    this.unbondingPeriod = 21;
    this.prefix = "bnb";
    this.validatorPrefix = `${this.prefix}valoper`;
  }
}

export default BinanceBeaconChain;
