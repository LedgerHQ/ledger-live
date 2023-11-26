abstract class cosmosBase {
  abstract lcd: string;
  abstract stakingDocUrl: string;
  abstract unbondingPeriod: number;
  abstract ledgerValidator?: string;
  abstract validatorPrefix: string;
  abstract prefix: string;
  defaultPubKeyType = "/cosmos.crypto.secp256k1.PubKey";
  defaultGas = 100000;
  minGasPrice = 0.0025;
  version = "v1beta1";
  public static COSMOS_FAMILY_LEDGER_VALIDATOR_ADDRESSES: string[] = [];
}

export default cosmosBase;
