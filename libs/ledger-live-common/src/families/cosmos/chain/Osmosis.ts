import CosmosBase from "./cosmosBase";
import { BigNumber } from "bignumber.js";

class Osmosis extends CosmosBase {
  stakingDocUrl: string;
  unbondingPeriod: number;
  validatorOperatorAddressPrefix: string;
  // Provided by coin config
  lcd!: string;
  ledgerValidator!: string;
  constructor() {
    super();
    this.unbondingPeriod = 14;
    this.stakingDocUrl =
      "https://support.ledger.com/hc/en-us/articles/6235986236957-Earn-Osmosis-OSMO-staking-rewards-in-Ledger-Live?docs=true";
    this.minimalTransactionAmount = new BigNumber(10);
    this.validatorOperatorAddressPrefix = "osmovaloper";
    CosmosBase.COSMOS_FAMILY_LEDGER_VALIDATOR_ADDRESSES.push(
      this.ledgerValidator
    );
  }
}

export default Osmosis;
