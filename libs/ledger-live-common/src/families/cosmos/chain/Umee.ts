import CosmosBase from "./cosmosBase";
import { BigNumber } from "bignumber.js";

class Umee extends CosmosBase {
  lcd!: string;
  stakingDocUrl: string;
  unbondingPeriod: number;
  ledgerValidator!: string;
  validatorPrefix: string;
  prefix: string;

  constructor() {
    super();
    this.stakingDocUrl = "https://support.ledger.com/hc/en-us/articles/9604941727261?support=true";
    this.unbondingPeriod = 28;
    this.prefix = "umee";
    this.validatorPrefix = `${this.prefix}valoper`;
    this.minimalTransactionAmount = new BigNumber(15000);
  }
}

export default Umee;
