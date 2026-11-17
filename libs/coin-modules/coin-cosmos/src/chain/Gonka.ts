import CosmosBase from "./cosmosBase";

class Gonka extends CosmosBase {
  stakingDocUrl: string;
  unbondingPeriod: number;
  prefix: string;
  validatorPrefix: string;
  // Since the v0.2.16 upgrade the chain prices bank transfers through its "cosmos" fee group at
  // 1 ngonka per gas, and rejects a lower fee with "insufficient fee". The legacy
  // FeeParams.MinGasPriceNgonka parameter is still 0 but no longer enforces anything.
  minGasPrice = 1;
  // Provided by coin config
  ledgerValidator!: string;
  lcd!: string;
  constructor() {
    super();
    this.stakingDocUrl = "";
    this.unbondingPeriod = 0;
    this.prefix = "gonka";
    this.validatorPrefix = `${this.prefix}valoper`;
  }
}

export default Gonka;
