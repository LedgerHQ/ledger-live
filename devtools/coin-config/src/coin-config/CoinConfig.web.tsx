import { Fragment } from "react";
import { Divider } from "@ledgerhq/lumen-ui-react";
import type { CoinConfigToolProps } from "../types";
import { KeyDetailsDialog } from "../components/keyDetailsDialog/KeyDetailsDialog";
import { KeyListSummary } from "../components/keyListSummary/KeyListSummary";
import { KeyRow } from "../components/keyRow/KeyRow";
import { ToolBar } from "../components/toolBar/ToolBar";
import { useCoinConfigViewModel } from "./internals/useCoinConfigViewModel";

export function CoinConfig(props: Readonly<CoinConfigToolProps>) {
  const viewModel = useCoinConfigViewModel(props);
  const { filteredKeys, getKeyDisplayState, selectedKey, selectKey, clearSelection } = viewModel;

  return (
    <div>
      <div className="sticky top-0 z-10 bg-canvas">
        <ToolBar
          search={viewModel.search}
          setSearch={viewModel.setSearch}
          filter={viewModel.filter}
          setFilter={viewModel.setFilter}
          filterOptions={viewModel.filterOptions}
          onClearAll={props.clearAllOverrides}
        />
        <Divider />
        <KeyListSummary
          overrideCount={viewModel.overrideCount}
          totalCount={viewModel.totalCount}
          filteredCount={filteredKeys.length}
        />
        <Divider className="bg-canvas-muted" />
      </div>
      {selectedKey && (
        <KeyDetailsDialog
          key={selectedKey}
          display={getKeyDisplayState(selectedKey)}
          setOverride={props.setOverride}
          clearOverride={props.clearOverride}
          onClose={clearSelection}
        />
      )}
      {filteredKeys.length === 0 && <p className="body-3 p-16 text-muted">Nothing matches.</p>}
      {filteredKeys.map(key => (
        <Fragment key={key}>
          <KeyRow display={getKeyDisplayState(key)} onSelect={() => selectKey(key)} />
          <Divider className="bg-canvas-muted" />
        </Fragment>
      ))}
    </div>
  );
}
