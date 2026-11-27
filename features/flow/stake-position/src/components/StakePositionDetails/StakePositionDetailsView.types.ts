import type { ReactNode } from "react";
import type { StakePositionDetailsLabels } from "../../copy/useStakePositionLabels";
import type {
  StakePositionAmount,
  StakePositionApyAppearance,
  StakePositionRewardsHeadline,
} from "../../types";

export type StakePositionNoticeAppearance = "info" | "warning";

export type StakePositionDetailsViewProps = Readonly<{
  labels: StakePositionDetailsLabels;
  rewards?: Readonly<{ amount: StakePositionAmount; headline?: StakePositionRewardsHeadline }>;
  balance?: StakePositionAmount;
  initialDeposit?: StakePositionAmount;
  /** The rate tag, such as "7.12% APY". */
  apyBadge?: string;
  apyAppearance: StakePositionApyAppearance;
  status: string;
  account?: Readonly<{ name: string; icon?: ReactNode }>;
  validator?: Readonly<{ name: string; imageUrl?: string; initial: string }>;
  exitAction: Readonly<{ label: string; isDisabled: boolean }> | null;
  notice: Readonly<{ text: string; appearance: StakePositionNoticeAppearance }> | null;
  showEarnMore: boolean;
  onEarnMore: () => void;
  onSelectExitAction: () => void;
  testID?: string;
}>;
