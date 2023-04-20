import CosmosBase from "./cosmosBase";
import { getEnv } from "../../../env";
import { BigNumber } from "bignumber.js";

class Osmosis extends CosmosBase {
  lcd: string;
  stakingDocUrl: string;
  unbondingPeriod: number;
  ledgerValidator: string;
  validatorOperatorAddressPrefix: string;
  constructor() {
    super();
    this.unbondingPeriod = 14;
    this.lcd = getEnv("API_OSMOSIS_NODE");
    this.stakingDocUrl =
      "https://support.ledger.com/hc/en-us/articles/6235986236957-Earn-Osmosis-OSMO-staking-rewards-in-Ledger-Live?docs=true";
    this.minimalTransactionAmount = new BigNumber(10);
    this.validatorOperatorAddressPrefix = "osmovaloper";
    this.ledgerValidator = "osmovaloper17cp6fxccqxrpj4zc00w2c7u6y0umc2jajsyc5t";
    CosmosBase.COSMOS_FAMILY_LEDGER_VALIDATOR_ADDRESSES.push(
      this.ledgerValidator
    );
  }
}

export default Osmosis;
