import CosmosBase from "./cosmosBase";

class SeiNetwork extends CosmosBase {
  lcd!: string;
  ledgerValidator!: string;
  stakingDocUrl: string;
  unbondingPeriod: number;
  validatorPrefix: string;
  prefix: string;

  constructor() {
    super();
    this.stakingDocUrl =
      "https://support.ledger.com/hc/en-us/articles/6235986236957-Earn-Osmosis-OSMO-staking-rewards-in-Ledger-Live?docs=true";
    this.unbondingPeriod = 28;
    this.prefix = "sei";
    this.validatorPrefix = `${this.prefix}valoper`;
  }
}

export default SeiNetwork;
