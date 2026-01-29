import { AccountLike } from "@ledgerhq/types-live";
import { Dispatch } from "redux";
import { updateAccountWithUpdater } from "~/actions/accounts";
import {
  PrepareSaveSwapProps,
  prepareLegacySaveSwapToHistory,
} from "@ledgerhq/live-common/exchange/swap/prepareLegacySaveSwapToHistory";

export function saveSwapToHistory(accounts: AccountLike[], dispatch: Dispatch) {
  return async ({ params }: { params: { swap: PrepareSaveSwapProps; transaction_id: string } }) => {
    const { accountId, updater } = prepareLegacySaveSwapToHistory({
      params,
      accounts,
    });

    dispatch(updateAccountWithUpdater({ accountId, updater }));

    return Promise.resolve("Swap saved to history");
  };
}
