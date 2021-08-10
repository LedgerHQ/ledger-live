import type { Account } from "../../types";
import type { CoreAccount } from "../../libcore/types";
import { libcoreAmountToBigNumber } from "../../libcore/buildBigNumber";
import type { AlgorandResources } from "./types";
import { AlgorandOperationTypeEnum } from "./types";

const getAlgorandResources = async (
  account: Account,
  coreAccount
): Promise<AlgorandResources> => {
  const algorandAccount = await coreAccount.asAlgorandAccount();
  const rewardsBigInt = await algorandAccount.getPendingRewards();
  const rewardsAccumulatedBigInt = await algorandAccount.getTotalRewards();
  const rewards = await libcoreAmountToBigNumber(rewardsBigInt);
  const rewardsAccumulated = await libcoreAmountToBigNumber(
    rewardsAccumulatedBigInt
  );
  return {
    rewards,
    rewardsAccumulated,
  };
};

const getAlgorandSpendableBalance = async (coreAccount) => {
  const algorandAccount = await coreAccount.asAlgorandAccount();
  const spendableBalanceBigInt = await algorandAccount.getSpendableBalance(
    AlgorandOperationTypeEnum.PAYMENT
  );
  const spendableBalance = await libcoreAmountToBigNumber(
    spendableBalanceBigInt
  );
  return spendableBalance;
};

const postBuildAccount = async ({
  account,
  coreAccount,
}: {
  account: Account;
  coreAccount: CoreAccount;
}): Promise<Account> => {
  account.algorandResources = await getAlgorandResources(account, coreAccount);
  account.spendableBalance = await getAlgorandSpendableBalance(coreAccount);
  return account;
};

export default postBuildAccount;
