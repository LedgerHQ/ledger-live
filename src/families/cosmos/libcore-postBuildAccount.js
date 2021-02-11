// @flow
import type { Account } from "../../types";
import type { CoreAccount } from "../../libcore/types";
import type { CosmosResources, CoreCosmosLikeAccount } from "./types";
import { BigNumber } from "bignumber.js";
import { log } from "@ledgerhq/logs";
import {
  libcoreAmountToBigNumber,
  libcoreBigIntToBigNumber,
} from "../../libcore/buildBigNumber";
import { promiseAllBatched } from "../../promise";
import { getMaxEstimatedBalance } from "./logic";

const getValidatorStatus = async (
  cosmosAccount: CoreCosmosLikeAccount,
  address
) => {
  const status = ["unbonded", "unbonding", "bonded"];
  const validatorInfo = await cosmosAccount.getValidatorInfo(address);
  const rawStatus = await validatorInfo.getActiveStatus();
  // Pre stargate
  if (["0", "1", "2"].includes(rawStatus)) {
    return status[parseInt(rawStatus)];
  }
  // Stargate
  const stargateStatusMap = {
    BOND_STATUS_UNBONDED: "unbonded",
    BOND_STATUS_UNBONDING: "unbonding",
    BOND_STATUS_BONDED: "bonded",
  };
  return stargateStatusMap[rawStatus] || "unbonded";
};

const getFlattenDelegation = async (cosmosAccount) => {
  const delegations = await cosmosAccount.getDelegations();
  const pendingRewards = await cosmosAccount.getPendingRewards();

  return await promiseAllBatched(10, delegations, async (delegation) => {
    const validatorAddress = await delegation.getValidatorAddress();

    let reward;
    for (let i = 0; i < pendingRewards.length; i++) {
      if (
        (await pendingRewards[i].getValidatorAddress()) === validatorAddress
      ) {
        reward = await pendingRewards[i].getRewardAmount();
        break;
      }
    }

    return {
      amount: await libcoreAmountToBigNumber(
        await delegation.getDelegatedAmount()
      ),
      validatorAddress,
      pendingRewards: reward
        ? await libcoreAmountToBigNumber(reward)
        : BigNumber(0),
      status: await getValidatorStatus(cosmosAccount, validatorAddress),
    };
  });
};

const getFlattenRedelegations = async (cosmosAccount) => {
  const redelegations = await cosmosAccount.getRedelegations();

  const toFlatten = await promiseAllBatched(
    3,
    redelegations,
    async (redelegation) =>
      await promiseAllBatched(
        3,
        await redelegation.getEntries(),
        async (entry) => ({
          validatorSrcAddress: await redelegation.getSrcValidatorAddress(),
          validatorDstAddress: await redelegation.getDstValidatorAddress(),
          amount: await libcoreBigIntToBigNumber(
            await entry.getInitialBalance()
          ),
          completionDate: await entry.getCompletionTime(),
        })
      )
  );

  return toFlatten.reduce((old, current) => [...old, ...current], []);
};

const getFlattenUnbonding = async (cosmosAccount) => {
  const unbondings = await cosmosAccount.getUnbondings();

  const toFlatten = await promiseAllBatched(
    3,
    unbondings,
    async (unbonding) =>
      await promiseAllBatched(
        3,
        await unbonding.getEntries(),
        async (entry) => ({
          validatorAddress: await unbonding.getValidatorAddress(),
          amount: await libcoreBigIntToBigNumber(
            await entry.getInitialBalance()
          ),
          completionDate: await entry.getCompletionTime(),
        })
      )
  );

  return toFlatten.reduce((old, current) => [...old, ...current], []);
};

const filterDelegation = (delegations) => {
  return delegations.filter((delegation) => delegation.amount.gt(0));
};

const getCosmosResources = async (
  account: Account,
  coreAccount
): Promise<CosmosResources> => {
  const cosmosAccount = await coreAccount.asCosmosLikeAccount();
  const flattenDelegation = await getFlattenDelegation(cosmosAccount);
  const flattenUnbonding = await getFlattenUnbonding(cosmosAccount);
  const flattenRedelegation = await getFlattenRedelegations(cosmosAccount);
  const res = {
    delegations: filterDelegation(flattenDelegation),
    redelegations: flattenRedelegation,
    unbondings: flattenUnbonding,
    delegatedBalance: flattenDelegation.reduce(
      (old, current) => old.plus(current.amount),
      BigNumber(0)
    ),
    pendingRewardsBalance: flattenDelegation.reduce(
      (old, current) => old.plus(current.pendingRewards),
      BigNumber(0)
    ),
    unbondingBalance: flattenUnbonding.reduce(
      (old, current) => old.plus(current.amount),
      BigNumber(0)
    ),
    withdrawAddress: "",
  };

  return res;
};

const postBuildAccount = async ({
  account,
  coreAccount,
}: {
  account: Account,
  coreAccount: CoreAccount,
}): Promise<Account> => {
  log("cosmos/post-buildAccount", "getCosmosResources");
  account.cosmosResources = await getCosmosResources(account, coreAccount);
  log("cosmos/post-buildAccount", "getCosmosResources DONE");
  account.spendableBalance = getMaxEstimatedBalance(account, BigNumber(0));
  if (account.spendableBalance.lt(0)) {
    account.spendableBalance = BigNumber(0);
  }
  return account;
};

export default postBuildAccount;
