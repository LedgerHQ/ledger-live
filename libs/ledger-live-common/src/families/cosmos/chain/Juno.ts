import CosmosBase from "./cosmosBase";

class Juno extends CosmosBase {
  lcd: string;
  stakingDocUrl: string;
  unbondingPeriod: number;
  ledgerValidator: string;
  validatorOperatorAddressPrefix: string;
  constructor() {
    super();
    this.lcd = "https://lcd-juno.itastakers.com";
    this.stakingDocUrl =
      "https://support.ledger.com/hc/en-us/articles/6235986236957-Earn-Osmosis-OSMO-staking-rewards-in-Ledger-Live?docs=true";
    this.defaultGas = 100000;
    this.unbondingPeriod = 28;
    this.validatorOperatorAddressPrefix = "junovaloper";
    this.ledgerValidator = "";
  }
}

export default Juno;
