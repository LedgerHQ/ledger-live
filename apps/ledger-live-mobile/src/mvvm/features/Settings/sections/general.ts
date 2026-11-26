import { useCallback, useMemo } from "react";
import type { GeneralSettingsValues, SettingsPort, UpdateOf } from "@features/flow-settings";
import { useDispatch, useSelector } from "~/context/hooks";
import { setTheme } from "~/actions/settings";
import { themeSelector } from "~/reducers/settings";

export type GeneralSettingUpdate = UpdateOf<GeneralSettingsValues>;

export type GeneralSettingsPort = SettingsPort<GeneralSettingsValues, GeneralSettingUpdate>;

/**
 * The General section's part of the settings port: its values from the legacy store, and its
 * changes with the side effects the legacy General screens run today.
 */
export function useGeneralSettingsAdapter(): GeneralSettingsPort {
  const dispatch = useDispatch();
  const theme = useSelector(themeSelector);

  const values = useMemo<GeneralSettingsValues>(() => ({ theme }), [theme]);

  const setValue = useCallback(
    (update: GeneralSettingUpdate) => {
      if (update.key === "theme") dispatch(setTheme(update.value));
    },
    [dispatch],
  );

  return useMemo(() => ({ values, setValue }), [values, setValue]);
}
