import type { AccountBridge } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import BigNumber from "bignumber.js";
import type { AleoAccount, Transaction as AleoTransaction } from "../types";
import { getRecordByCommitment, isPrivateTransaction } from "../logic/utils";
import { createTransaction } from "./createTransaction";
import { prepareTransaction } from "./prepareTransaction";

export const estimateMaxSpendable: AccountBridge<
  AleoTransaction,
  AleoAccount
>["estimateMaxSpendable"] = async ({ account, parentAccount, transaction }) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const t = transaction ?? createTransaction(mainAccount);

  const preparedTransaction = await prepareTransaction(mainAccount, {
    ...t,
    useAllAmount: true,
  });

  if (isPrivateTransaction(preparedTransaction)) {
    const commitment = preparedTransaction.properties.amountRecordCommitment;
    const amountRecord = commitment
      ? getRecordByCommitment({ account: mainAccount, commitment })
      : null;

    return new BigNumber(amountRecord?.microcredits ?? "0");
  }

  return preparedTransaction.amount;
};
