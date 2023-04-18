import CosmosBase from "./cosmosBase";

class Evmos extends CosmosBase {
  stakingDocUrl: string;
  unbondingPeriod: number;
  validatorPrefix: string;
  prefix: string;
  // Provided by coin config
  ledgerValidator!: string;
  lcd!: string;
  constructor() {
    super();
    this.stakingDocUrl =
      "https://support.ledger.com/hc/en-us/articles/6235986236957-Earn-Osmosis-OSMO-staking-rewards-in-Ledger-Live?docs=true";
    this.unbondingPeriod = 21;
    this.prefix = "evmos";
    this.validatorPrefix = `${this.prefix}valoper`;
  }
}

export default Evmos;
