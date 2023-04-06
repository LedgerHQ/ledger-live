import CosmosBase from "./cosmosBase";

class Persistence extends CosmosBase {
  stakingDocUrl: string;
  unbondingPeriod: number;
  validatorOperatorAddressPrefix: string;
  lcd!: string;
  ledgerValidator!: string;
  prefix: string;

  constructor() {
    super();
    this.stakingDocUrl =
      "https://support.ledger.com/hc/en-us/articles/6235986236957-Earn-Osmosis-OSMO-staking-rewards-in-Ledger-Live?docs=true";
    this.defaultGas = 100000;
    this.unbondingPeriod = 28;
    this.validatorOperatorAddressPrefix = "persistencevaloper";
    this.prefix = "persistence";
  }
}

export default Persistence;
