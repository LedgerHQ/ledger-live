import type { Account, AccountBridge } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import BigNumber from "bignumber.js";
import { ChainAPI } from "./api";
import { getStakeAccountMinimumBalanceForRentExemption } from "./api/chain/web3";
import { getMainAccount } from "../../account";
import { estimateTxFee } from "./tx-fees";

export const estimateFeeAndSpendable = async (
  api: ChainAPI,
  account: Account,
  transaction?: Transaction | undefined | null,
): Promise<{ fee: number; spendable: BigNumber }> => {
  const txKind = transaction?.model.kind ?? "transfer";
  const txFee = await estimateTxFee(api, account, txKind);

  const spendableBalance = BigNumber.max(account.spendableBalance.minus(txFee), 0);

  switch (txKind) {
    case "token.createATA": {
      const assocAccRentExempt = await api.getAssocTokenAccMinNativeBalance();

      return {
        fee: txFee + assocAccRentExempt,
        spendable: BigNumber.max(spendableBalance.minus(assocAccRentExempt), 0),
      };
    }
    case "stake.createAccount": {
      const stakeAccRentExempt = await getStakeAccountMinimumBalanceForRentExemption(api);
      const unstakeReserve =
        (await estimateTxFee(api, account, "stake.undelegate")) +
        (await estimateTxFee(api, account, "stake.withdraw"));

      return {
        fee: txFee + stakeAccRentExempt,
        spendable: BigNumber.max(
          spendableBalance.minus(stakeAccRentExempt).minus(unstakeReserve),
          0,
        ),
      };
    }

    default: {
      return {
        fee: txFee,
        spendable: spendableBalance,
      };
    }
  }
};

const estimateMaxSpendableWithAPI = async (
  {
    account,
    parentAccount,
    transaction,
  }: Parameters<AccountBridge<Transaction>["estimateMaxSpendable"]>[0],
  api: ChainAPI,
): Promise<BigNumber> => {
  const mainAccount = getMainAccount(account, parentAccount);

  switch (account.type) {
    case "Account":
      return (await estimateFeeAndSpendable(api, mainAccount, transaction)).spendable;
    case "TokenAccount":
      return account.spendableBalance;
  }

  throw new Error("not supported account type");
};

export default estimateMaxSpendableWithAPI;
