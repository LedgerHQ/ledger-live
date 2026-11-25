import { useCallback, useMemo } from "react";
import type { SettingsPort, SettingsValues, SettingUpdate } from "@features/flow-settings";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { applyGeneralSettingUpdate } from "./sections/general";
import { userThemeSelector } from "~/renderer/reducers/settings";

/**
 * Builds the settings port of Ledger Wallet Desktop from the legacy settings store. Each change
 * runs the side effects the legacy Settings screens run today, section by section.
 */
export function useDesktopSettingsPort(): SettingsPort {
  const dispatch = useDispatch();
  const theme = useSelector(userThemeSelector);

  const values = useMemo<SettingsValues>(() => ({ theme: theme ?? "system" }), [theme]);

  const setValue = useCallback(
    (update: SettingUpdate) => applyGeneralSettingUpdate(dispatch, update),
    [dispatch],
  );

  return useMemo(() => ({ values, setValue }), [values, setValue]);
}
