import { CosmosOperationMode } from "../types";
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
  gas: {
    [Key in CosmosOperationMode]: number;
  } = {
    // refer to https://github.com/chainapsis/keplr-wallet/blob/master/packages/stores/src/account/cosmos.ts#L113 for the gas fees
    send: 90000,
    delegate: 250000,
    undelegate: 250000,
    redelegate: 300000,
    claimReward: 140000,
    claimRewardCompound: 400000,
  };
  public static COSMOS_FAMILY_LEDGER_VALIDATOR_ADDRESSES: string[] = [];
}

export default cosmosBase;
