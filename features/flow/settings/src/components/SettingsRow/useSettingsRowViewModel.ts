import { useIsSettingHidden } from "../HiddenSettingsProvider/HiddenSettingsProvider";
import type { SettingsRowProps } from "./SettingsRow.types";
import type { SettingsRowViewProps } from "./SettingsRowView.types";
import { isPressableTrailing } from "../../logic/settingsRowTrailing";

export function useSettingsRowViewModel({
  settingId,
  ...row
}: SettingsRowProps): SettingsRowViewProps | null {
  const isHidden = useIsSettingHidden(settingId);
  if (isHidden) return null;

  const { trailing, disabled, testID, onSelect } = row;
  const press = isPressableTrailing(trailing) ? trailing.onSelect : onSelect;
  return {
    ...row,
    onPress: press && !disabled ? press : undefined,
    toggleTestID: testID && `${testID}-toggle`,
  };
}
