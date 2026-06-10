import { Fragment } from "react";
import type { FeatureFlagsToolProps } from "../../types";
import { FlagRow } from "../flagRow/FlagRow.web";
import { FlagListSummary } from "../flagListSummary/FlagListSummary";
import { Divider } from "@ledgerhq/lumen-ui-react";
import { Sidebar } from "../sidebar/Sidebar";
import { ToolBar } from "../toolBar/ToolBar";
import { useFlagListViewModel, type FlagListViewProps } from "./useFlagListViewModel.web";

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
  onCloseSidebar,
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
        <Sidebar
          setOverride={setOverride}
          display={getFlagDisplayState(selectedFlagId)}
          onClose={onCloseSidebar}
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
