import { BigNumber } from "bignumber.js";

abstract class cosmosBase {
  abstract lcd: string;
  abstract stakingDocUrl: string;
  abstract unbondingPeriod: number;
  abstract ledgerValidator?: string;
  abstract validatorPrefix: string;
  abstract prefix: string;
  defaultGas = 100000;
  minGasPrice = 0.0025;
  // minimalTransactionAmount is only used in bot tests. When we make a transaction ,we should make sure that the spendable balance is greater than minimalTransactionAmount. We usually use the upper limit of send transaction fee as the minimalTransactionAmount. e.g. 5000 uatom for cosmos.
  minimalTransactionAmount = new BigNumber(5000);
  version = "v1beta1";
  public static COSMOS_FAMILY_LEDGER_VALIDATOR_ADDRESSES: string[] = [];
}

export default cosmosBase;
