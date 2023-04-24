import { BigNumber } from "bignumber.js";

abstract class cosmosBase {
  abstract lcd: string;
  abstract stakingDocUrl: string;
  abstract unbondingPeriod: number;
  abstract ledgerValidator: string;
  abstract validatorOperatorAddressPrefix: string;
  defaultGas = 100000;
  minGasprice = 0.0025;
  minimalTransactionAmount = new BigNumber(10000);
  version = "v1beta1";
  public static COSMOS_FAMILY_LEDGER_VALIDATOR_ADDRESSES: string[] = [];
}

export default cosmosBase;
