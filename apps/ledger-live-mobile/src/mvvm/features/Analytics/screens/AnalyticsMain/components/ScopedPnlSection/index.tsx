import React from "react";
import { Box, Skeleton } from "@ledgerhq/lumen-ui-rnative";
import { PnlSectionView } from "../PnlSection/PnlSectionView";
import {
  useScopedPnlSectionViewModel,
  type ScopedPnlSectionProps,
} from "./useScopedPnlSectionViewModel";

export const SCOPED_PNL_TEST_IDS = {
  skeleton: "analytics-pnl-skeleton",
  unavailable: "analytics-pnl-unavailable",
} as const;

export function ScopedPnlSection(props: ScopedPnlSectionProps) {
  const { status, viewModel } = useScopedPnlSectionViewModel(props);
  if (status === "loading")
    return (
      <Box lx={{ paddingHorizontal: "s16" }}>
        <Skeleton testID={SCOPED_PNL_TEST_IDS.skeleton} lx={{ height: "s112", width: "full" }} />
      </Box>
    );
  if (status !== "ready")
    return (
      <Box lx={{ paddingHorizontal: "s16" }} testID={SCOPED_PNL_TEST_IDS.unavailable}>
        {props.statusContent}
      </Box>
    );
  const { shouldDisplayPnl, ...pnl } = viewModel;
  return shouldDisplayPnl ? <PnlSectionView {...pnl} /> : null;
}
