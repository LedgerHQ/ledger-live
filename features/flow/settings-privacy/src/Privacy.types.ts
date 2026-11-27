import type { SettingsRowProps } from "@features/flow-settings";
import type { PrivacyRowId } from "./logic/privacyRows";

export type PrivacyRowViewProps = Readonly<
  Omit<SettingsRowProps, "icon" | "settingId"> & { id: PrivacyRowId }
>;

/** An event the section sends each time its state changes. `id` keeps the event across renders. */
export type PrivacyStateEvent = Readonly<{ id: string; event: string; mandatory?: boolean }>;

export type PrivacyViewProps = Readonly<{
  rows: readonly PrivacyRowViewProps[];
  stateEvents: readonly PrivacyStateEvent[];
  testID?: string;
}>;

export type PrivacyProps = Readonly<{ testID?: string }>;
