import { getAccountIdFromWalletAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import { AccountLike } from "@ledgerhq/types-live";
import { Dispatch } from "redux";
import { updateAccountWithUpdater } from "~/actions/accounts";
import {
  PrepareSaveSwapProps,
  prepareSaveSwapToHistory,
} from "@ledgerhq/live-common/exchange/swap/prepareSaveSwapToHistory";

export function saveSwapToHistory(accounts: AccountLike[], dispatch: Dispatch) {
  return async ({ params }: { params: { swap: PrepareSaveSwapProps; transaction_id: string } }) => {
    const { swap, transaction_id } = params;

    const fromId = getAccountIdFromWalletAccountId(swap.fromAccountId);
    const toId = getAccountIdFromWalletAccountId(swap.toAccountId);
    if (!fromId || !toId) return Promise.reject("Accounts not found");

    const { accountId, updater } = prepareSaveSwapToHistory(accounts, {
      ...swap,
      fromAccountId: fromId,
      toAccountId: toId,
      transactionId: transaction_id,
    });

    dispatch(updateAccountWithUpdater({ accountId, updater }));

    return Promise.resolve("Swap saved to history");
  };
}
