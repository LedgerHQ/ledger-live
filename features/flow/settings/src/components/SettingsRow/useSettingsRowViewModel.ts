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

  const { trailing, disabled, testID } = row;
  return {
    ...row,
    onPress: isPressableTrailing(trailing) && !disabled ? trailing.onSelect : undefined,
    toggleTestID: testID && `${testID}-toggle`,
  };
}
