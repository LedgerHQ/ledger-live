import CosmosBase from "./cosmosBase";
import { BigNumber } from "bignumber.js";

class Quicksilver extends CosmosBase {
  lcd!: string;
  stakingDocUrl: string;
  unbondingPeriod: number;
  ledgerValidator!: string;
  validatorPrefix: string;
  prefix: string;

  constructor() {
    super();
    this.stakingDocUrl = "https://support.ledger.com/hc/en-us/articles/9604308344221?support=true";
    this.unbondingPeriod = 21;
    this.prefix = "quick";
    this.validatorPrefix = `${this.prefix}valoper`;
    this.minimalTransactionAmount = new BigNumber(600);
  }
}

export default Quicksilver;
