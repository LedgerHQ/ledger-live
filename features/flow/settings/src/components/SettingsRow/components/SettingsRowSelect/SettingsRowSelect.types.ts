import type { SettingsRowTrailing } from "../../SettingsRow.types";

export type SettingsRowSelectProps = Readonly<{
  trailing: Extract<SettingsRowTrailing, { type: "select" }>;
  /** The row title, which names the select for assistive technologies. */
  rowTitle: string;
  disabled?: boolean;
}>;
