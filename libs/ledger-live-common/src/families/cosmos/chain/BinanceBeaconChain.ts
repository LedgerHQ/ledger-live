import CosmosBase from "./cosmosBase";

class BinanceBeaconChain extends CosmosBase {
  stakingDocUrl: string;
  unbondingPeriod: number;
  validatorOperatorAddressPrefix: string;
  prefix: string;
  // Provided by coin config
  lcd!: string;
  ledgerValidator!: string;
  constructor() {
    super();
    this.stakingDocUrl =
      "https://support.ledger.com/hc/en-us/articles/6235986236957-Earn-Osmosis-OSMO-staking-rewards-in-Ledger-Live?docs=true";
    this.defaultGas = 100000;
    this.unbondingPeriod = 21;
    this.validatorOperatorAddressPrefix = "bnbvaloper";
    this.prefix = "bnb";
  }
}

export default BinanceBeaconChain;
