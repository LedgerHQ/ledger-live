import type { Account } from "@ledgerhq/types-live";
import type { ShownStakePositionRequest } from "@features/flow-stake-position";

/**
 * The family slot rendering one staking position in the stake position sheet: the sheet itself,
 * its steps, and the hand-off of the exit transaction to the device screens.
 */
export type StakePositionSheetProps = Readonly<{
  /** When `isAccountRemoved`, the account as the request first saw it: its position is gone. */
  account: Account;
  isAccountRemoved: boolean;
  request: ShownStakePositionRequest;
  /** Off once the request is handed off to the device screens, answered or closed. */
  isOpen: boolean;
  /** The account syncs: the position can't be acted on until it is up to date. */
  isSyncing: boolean;
  onEarnMore: () => void;
}>;
