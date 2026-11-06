import {
  useAnalyticsPnlPositions,
  type AnalyticsPnlRenderProps,
} from "@features/flow-account-analytics";
import type { AccountLike } from "@ledgerhq/types-live";
import { usePnlSectionModel } from "../PnlSection/usePnlSectionModel";

export type ScopedPnlSectionProps = AnalyticsPnlRenderProps &
  Readonly<{ positions: readonly AccountLike[] }>;

const NO_POSITIONS: AccountLike[] = [];

export function useScopedPnlSectionViewModel({
  scope,
  catalogStatus,
  positions,
}: ScopedPnlSectionProps) {
  const { positions: selected, status } = useAnalyticsPnlPositions(
    { scope, catalogStatus },
    positions,
  );
  const viewModel = usePnlSectionModel({
    accounts: selected ?? NO_POSITIONS,
    shouldDisplayPnl: (selected?.length ?? 0) > 0,
  });
  return { status, viewModel };
}
