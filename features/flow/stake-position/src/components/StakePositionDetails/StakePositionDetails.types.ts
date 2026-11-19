import type { ReactNode } from "react";
import type {
  StakePositionAmount,
  StakePositionExitAction,
  StakePositionNotice,
  StakePositionRewardsHeadline,
  StakePositionState,
} from "../../types";

/**
 * The details of the position. Every figure comes from the backend position and the exit from the
 * chain: `toStakePositionDetailsProps` builds both. A missing figure hides its row.
 */
export type StakePositionDetailsProps = Readonly<{
  ticker: string;
  /** The backend status, as displayed. */
  status: StakePositionState;
  totalRewards?: StakePositionAmount;
  /** The rewards headline in the counter value. Without it, the crypto amount leads. */
  rewardsHeadline?: StakePositionRewardsHeadline;
  currentBalance?: StakePositionAmount;
  /** Web only, like its design. */
  initialDeposit?: StakePositionAmount;
  /** The validator APY, formatted, such as "7.81%". */
  apy?: string;
  validator?: Readonly<{ name: string; imageUrl?: string }>;
  /** The name of the account holding the position. The address row hides without it. */
  accountName?: string;
  /** The account's currency icon, next to its name. */
  accountIcon?: ReactNode;
  exitAction: StakePositionExitAction | null;
  /** Disables the exit action, for instance while the account syncs. */
  isExitActionPending: boolean;
  notice: StakePositionNotice | null;
  showEarnMore: boolean;
  onEarnMore: () => void;
  onSelectExitAction: (action: StakePositionExitAction) => void;
  testID?: string;
}>;
