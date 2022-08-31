import type { AccountBridge } from "@ledgerhq/types-live";
import getTransactionStatus from "./getTransactionStatus";
import { Transaction as EvmTransaction } from "./types";
import { getMainAccount } from "../../account";
import { createTransaction } from "./createTransaction";

export const estimateMaxSpendable: AccountBridge<EvmTransaction>["estimateMaxSpendable"] =
  async ({ account, parentAccount, transaction }) => {
    const mainAccount = getMainAccount(account, parentAccount);
    const estimatedTx = {
      ...createTransaction(mainAccount),
      ...transaction,
      useAllAmount: true,
    } as EvmTransaction;

    const { amount } = await getTransactionStatus(mainAccount, estimatedTx);
    return amount;
  };
