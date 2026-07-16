import type { FeatureId } from "@shared/feature-flags";
import type { FeatureFlagsToolProps, FlagDisplayState } from "../../types";
import { ALL_FLAG_IDS } from "../../constants";
import {
  useFeatureFlagsState,
  useFlagSelection,
  useFeatureFlagsFilters,
  useSortFlag,
} from "../../hooks";
import { buildOverridesExport, parseOverridesImport, saveFile, readFile } from "../../utils";
import type { ToolBarInput } from "../toolBar/types";

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
  readonly onCloseDetails: () => void;
  readonly clearSelectedOverride: () => void;
}

export function useFlagListViewModel(props: FeatureFlagsToolProps): FlagListViewProps {
  const { overrides, setOverride, clearAllOverrides } = props;

  const exportOverrides = () => {
    const { content, filename } = buildOverridesExport(overrides);
    saveFile(content, filename);
  };

  const importOverrides = () => {
    readFile()
      .then(parseOverridesImport)
      .then(({ overrides: imported, warnings }) => {
        warnings.forEach(warning => console.warn(warning));
        props.setAllOverrides(imported);
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
    onCloseDetails: clearSelection,
    clearSelectedOverride: () => {
      if (selectedFlagId) setOverride(selectedFlagId, undefined);
    },
  };
}
