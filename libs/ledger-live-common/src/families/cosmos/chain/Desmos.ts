import CosmosBase from "./cosmosBase";

class Desmos extends CosmosBase {
  stakingDocUrl: string;
  unbondingPeriod: number;
  validatorOperatorAddressPrefix: string;
  lcd: string;
  ledgerValidator!: string;
  constructor() {
    super();
    this.lcd = "https://lcd-axelar.whispernode.com:443";
    this.stakingDocUrl =
      "https://support.ledger.com/hc/en-us/articles/6235986236957-Earn-Osmosis-OSMO-staking-rewards-in-Ledger-Live?docs=true";
    this.defaultGas = 100000;
    this.unbondingPeriod = 21;
    this.validatorOperatorAddressPrefix = "axelarvaloper";
  }
}

export default Desmos;
