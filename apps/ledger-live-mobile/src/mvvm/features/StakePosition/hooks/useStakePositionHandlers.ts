import { useMemo } from "react";
import type { AccountLike } from "@ledgerhq/types-live";
import { getAccountIdFromWalletAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import type { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import {
  handlers as stakePositionHandlers,
  StakePositionAccountNotFound,
  StakePositionUnsupported,
  useStakePositionRequester,
  type StakePositionResult,
} from "@features/flow-stake-position";
import { stakePositionSheetOf } from "../utils/stakePositionSheetOf";

/** The `custom.stake.position.open` handler of the Earn live app player. */
export function useStakePositionHandlers(accounts: AccountLike[]): WalletAPICustomHandlers {
  const requestStakePosition = useStakePositionRequester("earn");

  return useMemo<WalletAPICustomHandlers>(
    () =>
      stakePositionHandlers({
        uiHooks: {
          "position.open": async ({ accountId: walletAccountId, ...position }) => {
            const accountId = getAccountIdFromWalletAccountId(walletAccountId);
            const account = accounts.find(({ id }) => id === accountId);
            if (!account) throw new StakePositionAccountNotFound();
            if (account.type !== "Account" || !stakePositionSheetOf(account.currency.family)) {
              throw new StakePositionUnsupported();
            }
            const result: StakePositionResult = await requestStakePosition({
              accountId: account.id,
              ...position,
            });
            return result;
          },
        },
      }),
    [accounts, requestStakePosition],
  );
}
