import type { StakePositionAmount } from "../../types";

export type StakePositionStatusAppearance = "success" | "warning" | "error";

export type StakePositionNoticeAppearance = "info" | "warning";

export type StakePositionDetailsViewProps = Readonly<{
  labels: Readonly<{
    balance: string;
    rewards: string;
    status: string;
    apy: string;
    validator: string;
    address: string;
    earnMore: string;
  }>;
  balance: StakePositionAmount;
  rewards?: StakePositionAmount;
  status: Readonly<{ label: string; appearance: StakePositionStatusAppearance }>;
  apy: string;
  validator: Readonly<{ name: string; imageUrl?: string; initial: string }>;
  address: string;
  exitAction: Readonly<{ label: string; isDisabled: boolean }> | null;
  notice: Readonly<{ text: string; appearance: StakePositionNoticeAppearance }> | null;
  onEarnMore: () => void;
  onSelectExitAction: () => void;
  testID?: string;
}>;
