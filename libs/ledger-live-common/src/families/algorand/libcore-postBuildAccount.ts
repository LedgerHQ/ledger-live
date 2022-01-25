import type { Account } from "../../types";
import type { CoreAccount } from "../../libcore/types";
import { libcoreAmountToBigNumber } from "../../libcore/buildBigNumber";
import type { AlgorandResources } from "./types";
import { AlgorandOperationTypeEnum } from "./types";

const getAlgorandResources = async (
  coreAccount
): Promise<AlgorandResources> => {
  const algorandAccount = await coreAccount.asAlgorandAccount();
  const rewardsBigInt = await algorandAccount.getPendingRewards();
  const rewards = await libcoreAmountToBigNumber(rewardsBigInt);
  return {
    rewards,
    nbAssets: 0, // unused in libcore implem
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
  account.algorandResources = await getAlgorandResources(coreAccount);
  account.spendableBalance = await getAlgorandSpendableBalance(coreAccount);
  return account;
};

export default postBuildAccount;
