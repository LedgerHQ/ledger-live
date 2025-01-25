import CosmosBase from "./cosmosBase";

class Injective extends CosmosBase {
  stakingDocUrl: string;
  unbondingPeriod: number;
  validatorPrefix: string;
  prefix: string;
  // Provided by coin config
  lcd!: string;
  ledgerValidator!: string;
  constructor() {
    super();
    this.stakingDocUrl =
      "https://support.ledger.com/hc/en-us/articles/9604085095965-zd?support=true";
    this.unbondingPeriod = 21;
    this.prefix = "inj";
    this.validatorPrefix = `${this.prefix}valoper`;
    this.defaultPubKeyType = "/injective.crypto.v1beta1.ethsecp256k1.PubKey";
  }
}

export default Injective;
