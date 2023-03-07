import CosmosBase from "./cosmosBase";

class SecretNetwork extends CosmosBase {
  lcd: string;
  stakingDocUrl: string;
  unbondingPeriod: number;
  ledgerValidator: string;
  validatorOperatorAddressPrefix: string;
  constructor() {
    super();
    this.lcd = "https://secret-4.api.trivium.network:1317";
    this.stakingDocUrl =
      "https://support.ledger.com/hc/en-us/articles/6235986236957-Earn-Osmosis-OSMO-staking-rewards-in-Ledger-Live?docs=true";
    this.defaultGas = 100000;
    this.unbondingPeriod = 28;
    this.validatorOperatorAddressPrefix = "secretvaloper";
    this.ledgerValidator = "";
  }
}

export default SecretNetwork;
