import { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import type { DevToolsConfig } from "@devtools/registry";
import { setOverride } from "@shared/feature-flags";
import { useFeature } from "@features/platform-feature-flags";

type ReceiveToolProps = Extract<DevToolsConfig[number], { id: "receive" }>["config"];

const NO_FAMILIES: readonly string[] = [];

export function useReceiveToolProps(): ReceiveToolProps {
  const dispatch = useDispatch();
  const flag = useFeature("newReceiveFlow");

  const enabled = !!flag?.enabled;
  const excludedFamilies = flag?.params?.excludedFamilies ?? NO_FAMILIES;

  const setEnabled = useCallback(
    (nextEnabled: boolean) =>
      dispatch(
        setOverride({
          key: "newReceiveFlow",
          value: { enabled: nextEnabled, params: { excludedFamilies: [...excludedFamilies] } },
        }),
      ),
    [dispatch, excludedFamilies],
  );

  const setExcludedFamilies = useCallback(
    (families: readonly string[]) =>
      dispatch(
        setOverride({
          key: "newReceiveFlow",
          value: { enabled, params: { excludedFamilies: [...families] } },
        }),
      ),
    [dispatch, enabled],
  );

  return useMemo(
    () => ({ flag: { enabled, excludedFamilies, setEnabled, setExcludedFamilies } }),
    [enabled, excludedFamilies, setEnabled, setExcludedFamilies],
  );
}
