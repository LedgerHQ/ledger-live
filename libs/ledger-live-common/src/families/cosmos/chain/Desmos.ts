import CosmosBase from "./cosmosBase";
import { BigNumber } from "bignumber.js";

class Desmos extends CosmosBase {
  stakingDocUrl: string;
  unbondingPeriod: number;
  validatorPrefix: string;
  prefix: string;
  // Provided by coin config
  lcd!: string;
  ledgerValidator!: string;
  constructor() {
    super();
    this.stakingDocUrl = "https://support.ledger.com/hc/en-us/articles/9604865330717?support=true";
    this.unbondingPeriod = 21;
    this.prefix = "desmos";
    this.validatorPrefix = `${this.prefix}valoper`;
    this.minimalTransactionAmount = new BigNumber(500);
  }
}

export default Desmos;
