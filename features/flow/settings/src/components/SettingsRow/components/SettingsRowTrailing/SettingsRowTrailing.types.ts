import type { SettingsRowTrailing } from "../../SettingsRow.types";

export type SettingsRowTrailingProps = Readonly<{
  trailing: SettingsRowTrailing;
  /** The row title, which names the toggle for assistive technologies. */
  rowTitle: string;
  disabled?: boolean;
  toggleTestID?: string;
}>;
