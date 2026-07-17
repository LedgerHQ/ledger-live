import { Fragment } from "react";
import type { FeatureFlagsToolProps } from "../../types";
import { FlagRow } from "../flagRow/FlagRow";
import { FlagListSummary } from "../flagListSummary/FlagListSummary";
import { Divider } from "@ledgerhq/lumen-ui-react";
import { FlagDetailsDialog } from "../flagDetailsDialog/FlagDetailsDialog";
import { ToolBar } from "../toolBar/ToolBar";
import { useFlagListViewModel, type FlagListViewProps } from "./useFlagListViewModel";

function FlagListView({
  toolBarProps,
  overrideCount,
  numberOfFlags,
  numberOfFilteredFlags,
  sortedFlagIds,
  getFlagDisplayState,
  setOverride,
  onSelectFlag,
  selectedFlagId,
  onCloseDetails,
  clearSelectedOverride,
}: FlagListViewProps) {
  return (
    <div>
      <div className="sticky top-0 z-10 bg-canvas">
        <ToolBar {...toolBarProps} />
        <Divider />
        <FlagListSummary
          overrideCount={overrideCount}
          numberOfFlags={numberOfFlags}
          numberOfFilteredFlags={numberOfFilteredFlags}
        />
        <Divider className="bg-canvas-muted" />
      </div>
      {selectedFlagId && (
        <FlagDetailsDialog
          setOverride={setOverride}
          display={getFlagDisplayState(selectedFlagId)}
          onClose={onCloseDetails}
          clearOverride={clearSelectedOverride}
        />
      )}
      <div>
        {sortedFlagIds.map(featureId => (
          <Fragment key={featureId}>
            <FlagRow
              display={getFlagDisplayState(featureId)}
              setOverride={setOverride}
              onSelect={() => onSelectFlag(featureId)}
            />
            <Divider className="bg-canvas-muted" />
          </Fragment>
        ))}
      </div>
    </div>
  );
}

export const FlagList = (props: FeatureFlagsToolProps) => (
  <FlagListView {...useFlagListViewModel(props)} />
);
