import CosmosBase from "./cosmosBase";

export default class Babylon extends CosmosBase {
  stakingDocUrl: string;
  unbondingPeriod: number;
  prefix: string;
  validatorPrefix: string;
  // Provided by coin config
  ledgerValidator!: string;
  lcd!: string;
  constructor() {
    super();
    this.stakingDocUrl = "";
    this.unbondingPeriod = 21; // TODO: fix with the correct amount, see https://docs.babylonlabs.io/developers/wallet_integration/babylon_wallet_integration/#unbonding
    this.prefix = "bbn";
    this.validatorPrefix = `${this.prefix}valoper`;
  }
}
