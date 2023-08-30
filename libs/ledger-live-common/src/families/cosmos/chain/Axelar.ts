import CosmosBase from "./cosmosBase";
import { BigNumber } from "bignumber.js";

class Axelar extends CosmosBase {
  stakingDocUrl: string;
  unbondingPeriod: number;
  prefix: string;
  validatorPrefix: string;
  // Provided by coin config
  ledgerValidator!: string;
  lcd!: string;
  constructor() {
    super();
    this.stakingDocUrl = "https://support.ledger.com/hc/en-us/articles/9603789661085?support=true";
    this.unbondingPeriod = 7;
    this.prefix = "axelar";
    this.validatorPrefix = `${this.prefix}valoper`;
    this.minimalTransactionAmount = new BigNumber(10000);
  }
}

export default Axelar;
