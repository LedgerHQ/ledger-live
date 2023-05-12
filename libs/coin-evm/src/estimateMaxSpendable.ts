import type { AccountBridge } from "@ledgerhq/types-live";
import { Transaction as EvmTransaction } from "./types";
import { prepareTransaction } from "./prepareTransaction";
import { createTransaction } from "./createTransaction";
import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import { EvmAPI } from "./api";

export function estimateMaxSpendable(
  evmAPI: EvmAPI
): AccountBridge<EvmTransaction>["estimateMaxSpendable"] {
  return async ({ account, parentAccount, transaction }) => {
    const mainAccount = getMainAccount(account, parentAccount);
    const estimatedTx = {
      ...createTransaction(mainAccount),
      ...transaction,
      useAllAmount: true,
    } as EvmTransaction;

    const { amount } = await prepareTransaction(evmAPI)(
      mainAccount,
      estimatedTx
    );

    return amount;
  };
}
