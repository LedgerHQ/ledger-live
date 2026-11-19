import type { ReactNode } from "react";
import type { SettingId } from "../../logic/hiddenSettings";

export type SettingsRowSelectOption = Readonly<{ value: string; label: string }>;

export type SettingsRowTrailing =
  | Readonly<{ type: "chevron"; onSelect: () => void }>
  | Readonly<{ type: "externalLink"; onSelect: () => void }>
  | Readonly<{ type: "toggle"; value: boolean; onToggle: (value: boolean) => void }>
  | Readonly<{ type: "value"; text: string }>
  | Readonly<{
      type: "select";
      value: string;
      options: readonly SettingsRowSelectOption[];
      onSelectOption: (value: string) => void;
    }>
  | Readonly<{ type: "button"; label: string; onSelect: () => void }>;

export type SettingsRowLink = Readonly<{ label: string; onSelect: () => void }>;

export type SettingsRowProps = Readonly<{
  title: string;
  description?: string;
  descriptionLink?: SettingsRowLink;
  icon?: ReactNode;
  trailing?: SettingsRowTrailing;
  /** Lets the app hide the row through HiddenSettingsProvider. */
  settingId?: SettingId;
  disabled?: boolean;
  testID?: string;
}>;
