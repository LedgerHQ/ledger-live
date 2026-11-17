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
  type StakePositionResult,
} from "@features/flow-stake-position";
import { stakePositionSheetOf } from "../utils/stakePositionSheetOf";

/**
 * The `custom.stake.position.open` handler of the Earn live app player. While the
 * `earnNativeStakePosition` flag is off it is not registered: the live app gets METHOD_NOT_FOUND.
 */
export function useStakePositionHandlers(accounts: AccountLike[]): WalletAPICustomHandlers {
  const requestStakePosition = useStakePositionRequester("earn");
  const isEnabled = useFeature("earnNativeStakePosition")?.enabled ?? false;

  return useMemo<WalletAPICustomHandlers>(() => {
    if (!isEnabled) return {};
    return stakePositionHandlers({
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
    });
  }, [isEnabled, accounts, requestStakePosition]);
}
