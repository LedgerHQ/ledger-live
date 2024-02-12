import CosmosBase from "./cosmosBase";

class Osmosis extends CosmosBase {
  stakingDocUrl: string;
  unbondingPeriod: number;
  validatorPrefix: string;
  prefix: string;
  // Provided by coin config
  lcd!: string;
  ledgerValidator!: string;
  constructor() {
    super();
    this.prefix = "osmo";
    this.unbondingPeriod = 14;
    this.stakingDocUrl =
      "https://support.ledger.com/hc/en-us/articles/6235986236957-Earn-Osmosis-OSMO-staking-rewards-in-Ledger-Live?docs=true";
    this.validatorPrefix = `${this.prefix}valoper`;
  }
}

export default Osmosis;
