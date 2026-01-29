import BigNumber from "bignumber.js";
import { AccountLike } from "@ledgerhq/types-live";
import { getAccountIdFromWalletAccountId } from "../../wallet-api/converters";
import { PrepareSaveSwapProps, prepareSaveSwapToHistory } from "./prepareSaveSwapToHistory";
import { convertToAtomicUnit } from "./webApp";

export type { PrepareSaveSwapProps } from "./prepareSaveSwapToHistory";

export function prepareLegacySaveSwapToHistory({
  params,
  accounts,
}: {
  params: { swap: PrepareSaveSwapProps; transaction_id: string };
  accounts: AccountLike[];
}) {
  const { swap, transaction_id } = params;

  const fromId = getAccountIdFromWalletAccountId(swap.fromAccountId);
  const toId = getAccountIdFromWalletAccountId(swap.toAccountId);
  if (!fromId || !toId) throw new Error("Accounts not found");

  const fromAccount = accounts.find(acc => acc.id === fromId);
  const toAccount = accounts.find(acc => acc.id === toId);
  if (!fromAccount || !toAccount) {
    throw new Error(`accountId ${fromId} unknown`);
  }

  return prepareSaveSwapToHistory(accounts, {
    ...swap,
    fromAccountId: fromId,
    toAccountId: toId,
    fromAmount: convertToAtomicUnit({
      amount: new BigNumber(swap.fromAmount),
      account: fromAccount,
    })!,
    toAmount: convertToAtomicUnit({
      amount: new BigNumber(swap.toAmount),
      account: toAccount,
    })!,
    transactionId: transaction_id,
  });
}
