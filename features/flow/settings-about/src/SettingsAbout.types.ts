import type { SettingsRowProps } from "@features/flow-settings";

export type SettingsAboutRowViewProps = Readonly<SettingsRowProps & { id: string }>;

export type SettingsAboutViewProps = Readonly<{
  rows: readonly SettingsAboutRowViewProps[];
  testID?: string;
}>;

export type SettingsAboutProps = Readonly<{ testID?: string }>;
