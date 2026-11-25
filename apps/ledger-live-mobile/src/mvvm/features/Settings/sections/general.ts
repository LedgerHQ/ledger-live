import type { GeneralSettingsValues, UpdateOf } from "@features/flow-settings";
import type { useDispatch } from "~/context/hooks";
import { setTheme } from "~/actions/settings";

type AppDispatch = ReturnType<typeof useDispatch>;

export type GeneralSettingUpdate = UpdateOf<GeneralSettingsValues>;

/**
 * Applies a General setting change with the side effects the legacy General screens run today.
 */
export function applyGeneralSettingUpdate(dispatch: AppDispatch, update: GeneralSettingUpdate) {
  switch (update.key) {
    case "theme":
      dispatch(setTheme(update.value));
      return;
  }
}
