import type { SettingsRowTrailing } from "../../SettingsRow.types";

export type SettingsRowSelectProps = Readonly<{
  trailing: Extract<SettingsRowTrailing, { type: "select" }>;
  disabled?: boolean;
}>;
