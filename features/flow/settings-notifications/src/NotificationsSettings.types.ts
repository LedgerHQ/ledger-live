import type { SettingsRowProps } from "@features/flow-settings";
import type { NotificationKey } from "./types";

export type NotificationsRowViewProps = Readonly<
  Omit<SettingsRowProps, "icon" | "settingId"> & { id: NotificationKey }
>;

export type OsPermissionBannerViewProps = Readonly<{
  title: string;
  description: string;
  action: string;
  onPressAction: () => void;
}>;

export type NotificationsSettingsViewProps = Readonly<{
  rows: readonly NotificationsRowViewProps[];
  /** Shown while the phone blocks notifications. */
  osPermissionBanner: OsPermissionBannerViewProps | null;
  testID?: string;
}>;

export type NotificationsSettingsProps = Readonly<{ testID?: string }>;
