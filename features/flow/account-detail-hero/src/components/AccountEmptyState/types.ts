import type { FundingAction } from "../../logic/resolveEmptyState";

export type AccountEmptyStateProps = Readonly<{
  fundingActions: readonly FundingAction[];
  testID?: string;
}>;
