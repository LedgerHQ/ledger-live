import type { DeviceModelId } from "@ledgerhq/devices";
export type AnnouncementDeviceModelId = Array<DeviceModelId | "no_nano">;
import { DeviceModelInfo } from "@ledgerhq/types-live";
export type AnnouncementDeviceFilter = {
  modelIds?: AnnouncementDeviceModelId;
  versions?: string[];
  apps?: string[];
};
export type AnnnouncementPlatformsFilter =
  | "desktop" // == windows || mac || linux
  | "mobile" // == android || ios
  | "android"
  | "ios"
  | "mac"
  | "windows"
  | "linux";
type AnnouncementBase = {
  uuid: string; // unique id defining the announcement
  level?: string; // info, warning, alert ... set the article's global color palette.
  icon?: string; // info, warning ... select the article's icon among a list of presets
  priority?: number; // 1, 2, 3 ... optionally set the item as sticky. Sticky elements are ordered first by priority and then by publication date.
  contextual?: string[]; // allow displaying the article in specific contextual parts of the app.
  published_at: string; // UTC date at which the content is displayed
  expired_at?: string; // optional UTC date at which the content is not available anymore.
  utm_campaign?: string; // optional UTM id for tracking purposes.
  languages?: string[]; // optional language targeting.
  currencies?: string[]; // optional per currency account ownership targeting.
  device?: AnnouncementDeviceFilter; // optional firmware targeting
  platforms?: AnnnouncementPlatformsFilter[]; // optional platform targeting
  appVersions?: string[]; // optional app version targeting. Accepts any valid semver string.
  liveCommonVersions?: string[]; // optional live-common version targeting. Accepts any valid semver string.
};
export type AnnouncementContent = {
  title: string;
  // article title
  text: string | null | undefined;
  // article text
  link?:
    | {
        // optional link to content
        href: string;
        // content URL
        label?: string; // optional link label
      }
    | null
    | undefined;
};
export type RawAnnouncement = AnnouncementBase & {
  content: Record<string, AnnouncementContent>;
};
export type Announcement = AnnouncementBase & {
  content: AnnouncementContent;
};
export type AnnouncementsUserSettings = {
  language: string;
  currencies: string[];
  getDate: () => Date;
  lastSeenDevice?: DeviceModelInfo | null;
  platform?: string;
  appVersion?: string;
};
export type AnnouncementsApi = {
  fetchAnnouncements: () => Promise<RawAnnouncement[]>;
};
export type State = {
  seenIds: string[];
  allIds: string[];
  cache: Record<string, Announcement>;
  isLoading: boolean;
  lastUpdateTime: number | null | undefined;
  error: Error | null | undefined;
};
