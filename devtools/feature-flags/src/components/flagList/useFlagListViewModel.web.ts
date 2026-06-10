import type { FeatureId } from "@shared/feature-flags";
import type { FeatureFlagsToolProps, FlagDisplayState } from "../../types";
import { ALL_FLAG_IDS } from "../../constants";
import { useFeatureFlagsState } from "../../hooks/useFeatureFlagsState";
import { useFlagSelection } from "../../hooks/useFlagSelection";
import { useFeatureFlagsFilters } from "../../hooks";
import { useSortFlag } from "../../hooks/useSortFlag";
import { buildOverridesExport } from "../../utils/exportOverrides";
import { parseOverridesImport } from "../../utils/importOverrides";
import { saveFile } from "../../utils/saveFile";
import { readFile } from "../../utils/readFile";
import type { ToolBarInput } from "../toolBar/types.web";

export interface FlagListViewProps {
  readonly toolBarProps: ToolBarInput;
  readonly overrideCount: number;
  readonly numberOfFlags: number;
  readonly numberOfFilteredFlags: number;
  readonly sortedFlagIds: FeatureId[];
  readonly getFlagDisplayState: (id: FeatureId) => FlagDisplayState;
  readonly setOverride: FeatureFlagsToolProps["setOverride"];
  readonly onSelectFlag: (id: FeatureId) => void;
  readonly selectedFlagId: FeatureId | null;
  readonly onCloseSidebar: () => void;
  readonly clearSelectedOverride: () => void;
}

export function useFlagListViewModel(props: FeatureFlagsToolProps): FlagListViewProps {
  const { overrides, setOverride, clearAllOverrides } = props;

  const exportOverrides =
    props.exportOverrides ??
    (() => {
      const { content, filename } = buildOverridesExport(overrides);
      saveFile(content, filename);
    });

  const importOverrides = () => {
    readFile()
      .then(parseOverridesImport)
      .then(({ overrides: imported, warnings }) => {
        warnings.forEach(warning => console.warn(warning));
        props.importOverrides(imported);
      })
      .catch(error => {
        console.warn("Import cancelled or failed", error);
      });
  };

  const { getFlagDisplayState } = useFeatureFlagsState(props);
  const { selectedFlagId, selectFlag, clearSelection } = useFlagSelection();
  const { filteredFlagIds, setSearch, search, filter, setFilter, counts } =
    useFeatureFlagsFilters(props);
  const { sortedFlagIds, category, direction, cycleCategory, toggleDirection } = useSortFlag({
    flagIds: filteredFlagIds,
    resolved: props.resolved,
    overrides: props.overrides,
  });

  return {
    toolBarProps: {
      filters: { search, setSearch, filter, setFilter, counts },
      sort: { category, direction, cycleCategory, toggleDirection },
      actions: { clearAllOverrides, exportOverrides, importOverrides },
    },
    overrideCount: Object.keys(overrides).length,
    numberOfFlags: ALL_FLAG_IDS.length,
    numberOfFilteredFlags: filteredFlagIds.length,
    sortedFlagIds,
    getFlagDisplayState,
    setOverride,
    onSelectFlag: selectFlag,
    selectedFlagId,
    onCloseSidebar: clearSelection,
    clearSelectedOverride: () => {
      if (selectedFlagId) setOverride(selectedFlagId, undefined);
    },
  };
}
