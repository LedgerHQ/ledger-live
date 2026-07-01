import { useCallback } from "react";
import { useBottomSheetRef } from "@ledgerhq/lumen-ui-rnative";
import {
  useFeatureFlagsToolActions,
  useFeatureFlagsToolState,
} from "../../context/FeatureFlagsToolContext.native";
import { buildOverridesExport } from "../../utils/exportOverrides";
import { parseOverridesImport } from "../../utils/importOverrides";
import { saveFile } from "../../utils/saveFile.native";
import { readFile } from "../../utils/readFile.native";

export interface FlagMenuViewProps {
  readonly menuRef: ReturnType<typeof useBottomSheetRef>;
  readonly openMenu: () => void;
  readonly onExport: () => void;
  readonly onImport: () => void;
  readonly onReset: () => void;
}

export function useFlagMenuViewModel(): FlagMenuViewProps {
  const { overrides } = useFeatureFlagsToolState();
  const { setAllOverrides, clearAllOverrides } = useFeatureFlagsToolActions();
  const menuRef = useBottomSheetRef();

  const runExport = useCallback(() => {
    const { content, filename } = buildOverridesExport(overrides);
    saveFile(content, filename).catch(error => console.warn("Export cancelled or failed", error));
  }, [overrides]);

  const runImport = useCallback(() => {
    readFile()
      .then(parseOverridesImport)
      .then(({ overrides: imported, warnings }) => {
        warnings.forEach(warning => console.warn(warning));
        setAllOverrides(imported);
      })
      .catch(error => console.warn("Import cancelled or failed", error));
  }, [setAllOverrides]);

  const select = useCallback(
    (action: () => void) => {
      menuRef.current?.dismiss();
      action();
    },
    [menuRef],
  );

  return {
    menuRef,
    openMenu: useCallback(() => menuRef.current?.present(), [menuRef]),
    onExport: useCallback(() => select(runExport), [select, runExport]),
    onImport: useCallback(() => select(runImport), [select, runImport]),
    onReset: useCallback(() => select(clearAllOverrides), [select, clearAllOverrides]),
  };
}
