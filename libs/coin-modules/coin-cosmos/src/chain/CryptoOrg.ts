import CosmosBase from "./cosmosBase";

class CryptoOrg extends CosmosBase {
  stakingDocUrl: string;
  unbondingPeriod: number;
  validatorPrefix: string;
  prefix: string;
  // Provided by coin config
  lcd!: string;
  ledgerValidator!: string;
  constructor() {
    super();
    this.stakingDocUrl = "https://support.ledger.com/hc/en-us/articles/360020501120?support=true";
    this.unbondingPeriod = 28;
    this.prefix = "cro";
    this.validatorPrefix = `${this.prefix}valoper`;
  }
}

export default CryptoOrg;
