import type { AccountBridge } from "@ledgerhq/types-live";
import { Transaction as EvmTransaction } from "./types";
import { prepareTransaction } from "./prepareTransaction";
import { createTransaction } from "./createTransaction";
import { getMainAccount } from "../../account";

export const estimateMaxSpendable: AccountBridge<EvmTransaction>["estimateMaxSpendable"] =
  async ({ account, parentAccount, transaction }) => {
    const mainAccount = getMainAccount(account, parentAccount);
    const estimatedTx = {
      ...createTransaction(mainAccount),
      ...transaction,
      useAllAmount: true,
    } as EvmTransaction;

    const { amount } = await prepareTransaction(mainAccount, estimatedTx);

    return amount;
  };
