import { useMemo } from "react";
import type { AccountLike } from "@ledgerhq/types-live";
import { getAccountIdFromWalletAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import type { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { useFeature } from "@features/platform-feature-flags";
import {
  handlers as stakePositionHandlers,
  StakePositionAccountNotFound,
  StakePositionUnsupported,
  useStakePositionRequester,
} from "@features/flow-stake-position";
import { stakePositionSheetOf } from "../utils/stakePositionSheetOf";

/**
 * The `custom.stake.position.open` handler of the Earn live app player: the position opens in the
 * app-level sheet. While the `earnNativeStakePosition` flag is off it is not registered: the live
 * app gets METHOD_NOT_FOUND.
 */
export function useStakePositionHandlers(accounts: AccountLike[]): WalletAPICustomHandlers {
  const requestStakePosition = useStakePositionRequester("earn");
  const isEnabled = useFeature("earnNativeStakePosition")?.enabled ?? false;

  return useMemo<WalletAPICustomHandlers>(() => {
    if (!isEnabled) return {};
    return stakePositionHandlers({
      uiHooks: {
        "position.open": ({ accountId: walletAccountId, positionId }) => {
          const accountId = getAccountIdFromWalletAccountId(walletAccountId);
          const account = accounts.find(({ id }) => id === accountId);
          if (!account) return Promise.reject(new StakePositionAccountNotFound());
          if (account.type !== "Account" || !stakePositionSheetOf(account.currency.family)) {
            return Promise.reject(new StakePositionUnsupported());
          }
          return requestStakePosition({ accountId: account.id, positionId });
        },
      },
    });
  }, [isEnabled, accounts, requestStakePosition]);
}
