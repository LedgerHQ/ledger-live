import {
  findSubAccountById,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/index";
import type { AccountBridge } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { computeAlgoMaxSpendable } from "./bridgeLogic";
import { ALGORAND_DUMMY_ADDRESS } from "./constants";
import createTransaction from "./createTransaction";
import { getEstimatedFees } from "./getFeesForTransaction";
import { AlgorandAccount, AlgorandTransaction } from "./types";

export const estimateMaxSpendable: AccountBridge<
  AlgorandTransaction,
  AlgorandAccount
>["estimateMaxSpendable"] = async ({ account, parentAccount, transaction }) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const { algorandResources } = mainAccount;
  if (!algorandResources) {
    throw new Error("Algorand account expected");
  }

  const tx = {
    ...createTransaction(account),
    subAccountId: account.type === "Account" ? null : account.id,
    ...transaction,
    recipient: transaction?.recipient || ALGORAND_DUMMY_ADDRESS,
    useAllAmount: true,
  };

  const tokenAccount = tx.subAccountId
    ? findSubAccountById(mainAccount, tx.subAccountId)
    : undefined;

  if (tokenAccount) {
    return tokenAccount.balance;
  } else {
    const fees = await getEstimatedFees(mainAccount, tx);

    let maxSpendable = computeAlgoMaxSpendable({
      accountBalance: mainAccount.balance,
      nbAccountAssets: algorandResources.nbAssets,
      mode: tx.mode,
    });

    maxSpendable = maxSpendable.minus(fees);

    return maxSpendable.gte(0) ? maxSpendable : new BigNumber(0);
  }
};
