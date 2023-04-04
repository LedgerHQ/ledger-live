import CosmosBase from "./cosmosBase";

class Quicksilver extends CosmosBase {
  lcd!: string;
  stakingDocUrl: string;
  unbondingPeriod: number;
  ledgerValidator!: string;
  validatorOperatorAddressPrefix: string;
  constructor() {
    super();
    this.stakingDocUrl =
      "https://support.ledger.com/hc/en-us/articles/6235986236957-Earn-Osmosis-OSMO-staking-rewards-in-Ledger-Live?docs=true";
    this.defaultGas = 100000;
    this.unbondingPeriod = 21;
    this.validatorOperatorAddressPrefix = "quickvaloper";
  }
}

export default Quicksilver;
