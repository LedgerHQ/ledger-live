import type { SettingsRowProps } from "@features/flow-settings";
import type { SecurityRowId } from "./logic/securityRows";
import type { BiometricKind } from "./types";

/** `biometricKind` is only set on the biometrics row, where it picks the icon. */
export type SecurityRowViewProps = Readonly<
  Omit<SettingsRowProps, "icon" | "settingId"> & {
    id: SecurityRowId;
    biometricKind?: BiometricKind;
  }
>;

/** An event the section sends each time its state changes. `id` keeps the event across renders. */
export type SecurityStateEvent = Readonly<{ id: string; event: string }>;

export type SecurityViewProps = Readonly<{
  rows: readonly SecurityRowViewProps[];
  stateEvents: readonly SecurityStateEvent[];
  testID?: string;
}>;

export type SecurityProps = Readonly<{ testID?: string }>;
