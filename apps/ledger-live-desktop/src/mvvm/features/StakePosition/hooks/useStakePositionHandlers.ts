import { useMemo } from "react";
import useIsMounted from "@ledgerhq/live-common/hooks/useIsMounted";
import { getAccountIdFromWalletAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import type { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import type { AccountLike } from "@ledgerhq/types-live";
import {
  handlers as stakePositionHandlers,
  StakePositionAccountNotFound,
  StakePositionUnsupported,
  useStakePositionRequester,
} from "@features/flow-stake-position";
import { importLLDCoinFamily } from "~/renderer/families";
import { STAKE_POSITION_ORIGIN } from "../constants";

/** `custom.stake.position.open` for a live app player: the position opens in the global dialog. */
export function useStakePositionHandlers(accounts: AccountLike[]): WalletAPICustomHandlers {
  const requestStakePosition = useStakePositionRequester(STAKE_POSITION_ORIGIN);
  const isMounted = useIsMounted();

  return useMemo<WalletAPICustomHandlers>(
    () =>
      stakePositionHandlers({
        uiHooks: {
          "position.open": async ({ accountId: walletApiAccountId, ...position }) => {
            const accountId = getAccountIdFromWalletAccountId(walletApiAccountId);
            const account = accounts.find(({ id }) => id === accountId);
            if (!account) throw new StakePositionAccountNotFound();
            if (account.type !== "Account") throw new StakePositionUnsupported();

            const family = await importLLDCoinFamily(account.currency.family);
            if (!family.StakePositionDialogContent) throw new StakePositionUnsupported();

            // The player may have unmounted while the family loaded: its requester cleanup has
            // already run, so a request made now would stay open with nobody to answer.
            if (!isMounted()) return { action: null };

            return requestStakePosition({ ...position, accountId: account.id });
          },
        },
      }),
    [accounts, isMounted, requestStakePosition],
  );
}
