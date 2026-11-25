import type { GeneralSettingsValues, UpdateOf } from "@features/flow-settings";
import type { AppDispatch } from "~/state-manager/configureStore";
import { setTheme } from "~/renderer/actions/settings";

export type GeneralSettingUpdate = UpdateOf<GeneralSettingsValues>;

/**
 * Applies a General setting change with the side effects the legacy General screens run today.
 */
export function applyGeneralSettingUpdate(dispatch: AppDispatch, update: GeneralSettingUpdate) {
  switch (update.key) {
    case "theme":
      dispatch(setTheme(update.value === "system" ? null : update.value));
      return;
  }
}
