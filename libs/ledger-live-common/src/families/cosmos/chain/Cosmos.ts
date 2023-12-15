import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import CosmosBase from "./cosmosBase";

class Cosmos extends CosmosBase {
  stakingDocUrl: string;
  unbondingPeriod: number;
  prefix: string;
  validatorPrefix: string;
  // Provided by coin config
  lcd!: string;
  ledgerValidator!: string;
  constructor() {
    super();
    this.unbondingPeriod = 21;
    this.stakingDocUrl =
      "https://support.ledger.com/hc/en-us/articles/360014339340-Earn-Cosmos-ATOM-staking-rewards-in-Ledger-Live?docs=true";
    this.prefix = "cosmos";
    this.validatorPrefix = this.prefix + "valoper";
    this.lcd = LiveConfig.getValueByKey("cosmos").lcd;
    this.ledgerValidator = LiveConfig.getValueByKey("cosmos").ledgerValidator || "";
  }
}

export default Cosmos;
