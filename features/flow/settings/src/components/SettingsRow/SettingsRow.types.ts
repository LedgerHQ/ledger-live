import type { ReactNode } from "react";
import type { SettingId } from "../../logic/hiddenSettings";

export type SettingsRowSelectOption = Readonly<{
  value: string;
  label: string;
  /** Secondary text of the option in the list, e.g. a currency ticker. */
  description?: string;
  /** Shorter text the closed select shows instead of `label`, e.g. a currency ticker. */
  shortLabel?: string;
}>;

/** Search field of a long select: options match on label, description or value as the user types. */
export type SettingsRowSearch = Readonly<{ placeholder: string; emptyLabel: string }>;

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
      search?: SettingsRowSearch;
    }>
  | Readonly<{ type: "picker"; label: string; onSelect: () => void }>
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
