import type { SettingsRowTrailing } from "../../SettingsRow.types";

export type SettingsRowTrailingProps = Readonly<{
  trailing: SettingsRowTrailing;
  disabled?: boolean;
  toggleTestID?: string;
}>;
