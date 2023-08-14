import type { RawAnnouncement, Announcement, AnnouncementsUserSettings } from "./types";
import semver from "semver";
import { version as LLCommonVersion } from "../../../package.json";

export function localizeAnnouncements(
  rawAnnouncements: RawAnnouncement[],
  context: AnnouncementsUserSettings,
): Announcement[] {
  return rawAnnouncements.map((rawAnnouncement: RawAnnouncement) => ({
    ...rawAnnouncement,
    content: rawAnnouncement.content[context.language] || rawAnnouncement.content["en"],
  }));
}
const platformFilters = {
  desktop: ["desktop", "mac", "windows", "linux"],
  mobile: ["mobile", "android", "ios"],
  mac: ["mac", "desktop"],
  linux: ["linux", "desktop"],
  windows: ["windows", "desktop"],
  ios: ["ios", "mobile"],
  android: ["android", "mobile"],
};
export function filterAnnouncements(
  announcements: Announcement[],
  context: AnnouncementsUserSettings,
): Announcement[] {
  const {
    language,
    currencies: contextCurrencies,
    getDate,
    lastSeenDevice,
    platform: contextPlatform,
    appVersion: contextAppVersion,
  } = context;
  const date = getDate();
  return announcements.filter(
    ({
      currencies,
      languages,
      published_at,
      expired_at,
      device,
      platforms,
      appVersions,
      liveCommonVersions,
    }) => {
      if (languages && !languages.includes(language)) {
        return false;
      }

      if (currencies && !currencies.some(c => contextCurrencies.includes(c))) {
        return false;
      }

      // filter out by device info
      if (device && lastSeenDevice) {
        const { modelIds, versions, apps } = device;
        if (modelIds && modelIds.length && !modelIds.includes(lastSeenDevice.modelId)) return false;
        if (versions && versions.length && !versions.includes(lastSeenDevice.deviceInfo.version))
          return false;
        if (apps && apps.length && !lastSeenDevice.apps.some(({ name }) => apps.includes(name)))
          return false;
      }
      if (
        lastSeenDevice === undefined &&
        device &&
        device.modelIds &&
        !device.modelIds.includes("no_nano")
      ) {
        return false;
      }

      // filter out by platform
      if (
        platforms &&
        platforms.length > 0 &&
        contextPlatform &&
        !platforms.some(p => platformFilters[p] && platformFilters[p].includes(contextPlatform))
      ) {
        return false;
      }

      // filter out by app version
      if (appVersions?.length && contextAppVersion) {
        const isAppVersionMatch = appVersions.some(version =>
          semver.satisfies(contextAppVersion, version),
        );

        if (isAppVersionMatch === false) return false;
      }

      // filter out by ll-comon version
      if (liveCommonVersions?.length) {
        const isLLCommonVersionMatch = liveCommonVersions.some(version =>
          semver.satisfies(LLCommonVersion, version),
        );

        if (isLLCommonVersionMatch === false) return false;
      }

      const publishedAt = new Date(published_at);

      if (publishedAt > date) {
        return false;
      }

      if (expired_at && new Date(expired_at) < date) {
        return false;
      }

      return true;
    },
  );
}
