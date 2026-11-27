import type { Account } from "@ledgerhq/types-live";
import type { ShownStakePosition, ShownStakePositionRequest } from "@features/flow-stake-position";

/**
 * The family slot rendering one staking position in the app-level stake position sheet: the
 * sheet, its steps, the device step of the exit and its result.
 */
export type StakePositionSheetProps = Readonly<{
  /** When `isAccountRemoved`, the account as the request first saw it: its position is gone. */
  account: Account;
  isAccountRemoved: boolean;
  request: ShownStakePositionRequest;
  phase: ShownStakePosition["phase"];
  /** The account syncs: the exit waits for it. */
  isSyncing: boolean;
  onEarnMore: () => void;
}>;
