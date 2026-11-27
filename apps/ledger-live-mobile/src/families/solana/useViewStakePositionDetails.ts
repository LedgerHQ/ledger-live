import { useCallback } from "react";
import type { SolanaAccount } from "@ledgerhq/live-common/families/solana/types";
import { useStakePositionOpener } from "@features/flow-stake-position";
import { useFeature } from "@features/platform-feature-flags";

/** The row action that opens a delegation in the stake position sheet. */
export const VIEW_STAKE_POSITION_DETAILS = "VIEW_STAKE_POSITION_DETAILS";

/**
 * Opens a delegation of the account page in the stake position sheet. Undefined while the entry
 * is off: it needs the flag's `accountPage` param and a mainnet account. Remote flag values are
 * not parsed with the flag schema, so only a literal `true` turns the param on.
 */
export function useViewStakePositionDetails(
  account: SolanaAccount,
): ((positionId: string) => void) | undefined {
  const feature = useFeature("earnNativeStakePosition");
  const openStakePosition = useStakePositionOpener("account");
  const accountId = account.id;
  const viewDetails = useCallback(
    (positionId: string) => openStakePosition({ accountId, positionId }),
    [accountId, openStakePosition],
  );

  const isOn =
    feature?.enabled === true &&
    feature.params?.accountPage === true &&
    account.currency.id === "solana";
  return isOn ? viewDetails : undefined;
}
