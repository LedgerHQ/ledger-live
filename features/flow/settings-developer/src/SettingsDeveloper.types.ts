import type { SettingsRowProps } from "@features/flow-settings";

export type SettingsDeveloperRowViewProps = Readonly<SettingsRowProps & { id: string }>;

export type SettingsDeveloperViewProps = Readonly<{
  rows: readonly SettingsDeveloperRowViewProps[];
  testID?: string;
}>;

export type SettingsDeveloperProps = Readonly<{ testID?: string }>;
