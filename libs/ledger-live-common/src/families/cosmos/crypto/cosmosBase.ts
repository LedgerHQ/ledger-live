import { CacheRes } from "../../../cache";
import { CosmosOperationMode, CosmosRewardsState } from "../types";

abstract class cosmosBase {
  abstract lcd: string;
  abstract stakingDocUrl: string;
  abstract unbonding_period: number;
  abstract ledger_validator: string;
  default_gas = 100000;
  min_gasprice = 0.0025;
  version = "v1beta1";
  gas: {
    [Key in CosmosOperationMode]: number;
  } = {
    // refer to https://github.com/chainapsis/keplr-wallet/blob/master/packages/stores/src/account/cosmos.ts#L113 for the gas fees
    send: 80000,
    delegate: 250000,
    undelegate: 250000,
    redelegate: 250000,
    claimReward: 140000,
    claimRewardCompound: 400000,
  };
  public abstract getRewardsState(): CacheRes<[], CosmosRewardsState>;
  public abstract validatorEstimatedRate(
    validatorCommission: number,
    rewardsState: CosmosRewardsState
  ): number;
}

export default cosmosBase;
