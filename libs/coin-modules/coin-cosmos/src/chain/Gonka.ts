import CosmosBase from "./cosmosBase";

class Gonka extends CosmosBase {
  stakingDocUrl: string;
  unbondingPeriod: number;
  prefix: string;
  validatorPrefix: string;
  // The chain's fee rule is a consensus parameter (FeeParams.MinGasPriceNgonka) currently at 0,
  // so the family's non-zero default would price transfers a fee-less chain never charges.
  minGasPrice = 0;
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
