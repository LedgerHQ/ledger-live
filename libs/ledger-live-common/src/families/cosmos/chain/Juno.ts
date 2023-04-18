import CosmosBase from "./cosmosBase";

class Juno extends CosmosBase {
  stakingDocUrl: string;
  unbondingPeriod: number;
  validatorPrefix: string;
  prefix: string;
  // Provided by coin config
  lcd!: string;
  ledgerValidator!: string;
  constructor() {
    super();
    this.stakingDocUrl =
      "https://support.ledger.com/hc/en-us/articles/6235986236957-Earn-Osmosis-OSMO-staking-rewards-in-Ledger-Live?docs=true";
    this.unbondingPeriod = 28;
    this.prefix = "juno";
    this.validatorPrefix = `${this.prefix}valoper`;
    this.minGasprice = 0.000825;
  }
}

export default Juno;
