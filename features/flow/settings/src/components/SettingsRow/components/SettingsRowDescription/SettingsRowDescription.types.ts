import type { SettingsRowLink } from "../../SettingsRow.types";

export type SettingsRowDescriptionProps = Readonly<{
  description?: string;
  link?: SettingsRowLink;
  disabled?: boolean;
}>;
