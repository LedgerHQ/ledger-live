import { useCallback, useMemo } from "react";
import type { GeneralSettingsValues, SettingsPort, UpdateOf } from "@features/flow-settings";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { setTheme } from "~/renderer/actions/settings";
import { userThemeSelector } from "~/renderer/reducers/settings";

export type GeneralSettingUpdate = UpdateOf<GeneralSettingsValues>;

export type GeneralSettingsPort = SettingsPort<GeneralSettingsValues, GeneralSettingUpdate>;

/**
 * The General section's part of the settings port: its values from the legacy store, and its
 * changes with the side effects the legacy General screens run today.
 */
export function useGeneralSettingsAdapter(): GeneralSettingsPort {
  const dispatch = useDispatch();
  const theme = useSelector(userThemeSelector);

  const values = useMemo<GeneralSettingsValues>(() => ({ theme: theme ?? "system" }), [theme]);

  const setValue = useCallback(
    (update: GeneralSettingUpdate) => {
      switch (update.key) {
        case "theme":
          dispatch(setTheme(update.value === "system" ? null : update.value));
          return;
      }
    },
    [dispatch],
  );

  return useMemo(() => ({ values, setValue }), [values, setValue]);
}
