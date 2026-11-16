import type {
  StakePositionAmount,
  StakePositionExitAction,
  StakePositionNotice,
  StakePositionState,
} from "../../types";

export type StakePositionDetailsProps = Readonly<{
  ticker: string;
  state: StakePositionState;
  balance: StakePositionAmount;
  /** Hidden when missing. */
  rewards?: StakePositionAmount;
  /** Formatted, e.g. "7.81%". Shown as unavailable when missing. */
  apy?: string;
  validator: Readonly<{ name: string; imageUrl?: string }>;
  /** The stake account address, middle-ellipsized on screen. */
  address: string;
  exitAction: StakePositionExitAction | null;
  notice: StakePositionNotice | null;
  /** Disables the exit action, for instance while the account syncs. */
  isExitActionPending: boolean;
  onEarnMore: () => void;
  onSelectExitAction: (action: StakePositionExitAction) => void;
  testID?: string;
}>;
