import CosmosBase from "./cosmosBase";

class SecretNetwork extends CosmosBase {
  lcd!: string;
  stakingDocUrl: string;
  unbondingPeriod: number;
  ledgerValidator!: string;
  validatorPrefix: string;
  prefix: string;

  constructor() {
    super();
    this.stakingDocUrl =
      "https://support.ledger.com/hc/en-us/articles/6235986236957-Earn-Osmosis-OSMO-staking-rewards-in-Ledger-Live?docs=true";
    this.unbondingPeriod = 28;
    this.prefix = "secret";
    this.validatorPrefix = `${this.prefix}valoper`;
    this.minGasprice = 0.25;
  }
}

export default SecretNetwork;
