import { useCallback, useMemo } from "react";
import type { SettingsPort, SettingsValues, SettingUpdate } from "@features/flow-settings";
import { useDispatch, useSelector } from "~/context/hooks";
import { themeSelector } from "~/reducers/settings";
import { applyGeneralSettingUpdate } from "./sections/general";

/**
 * Builds the settings port of Ledger Wallet Mobile from the legacy settings store. Each change
 * runs the side effects the legacy Settings screens run today, section by section.
 */
export function useMobileSettingsPort(): SettingsPort {
  const dispatch = useDispatch();
  const theme = useSelector(themeSelector);

  const values = useMemo<SettingsValues>(() => ({ theme }), [theme]);

  const setValue = useCallback(
    (update: SettingUpdate) => applyGeneralSettingUpdate(dispatch, update),
    [dispatch],
  );

  return useMemo(() => ({ values, setValue }), [values, setValue]);
}
