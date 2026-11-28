import type { SettingsDeveloperProps, SettingsDeveloperViewProps } from "./SettingsDeveloper.types";

export function useSettingsDeveloperViewModel({
  testID,
}: SettingsDeveloperProps): SettingsDeveloperViewProps {
  return { rows: [], testID };
}
