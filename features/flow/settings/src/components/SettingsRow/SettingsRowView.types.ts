import type { SettingsRowProps } from "./SettingsRow.types";

export type SettingsRowViewProps = Readonly<
  Omit<SettingsRowProps, "settingId"> & {
    /** Set only when the whole row opens something: chevron or external link, row enabled. */
    onPress?: () => void;
    toggleTestID?: string;
  }
>;
