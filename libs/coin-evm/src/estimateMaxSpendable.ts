import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import type { AccountBridge } from "@ledgerhq/types-live";
import { createTransaction } from "./createTransaction";
import { prepareTransaction } from "./prepareTransaction";
import { Transaction as EvmTransaction } from "./types";

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
