// @flow
import type {
  RawAnnouncement,
  Announcement,
  AnnouncementsUserSettings,
} from "./types";

export function localizeAnnouncements(
  rawAnnouncements: RawAnnouncement[],
  context: AnnouncementsUserSettings
): Announcement[] {
  return rawAnnouncements.map((rawAnnouncement: RawAnnouncement) => ({
    ...rawAnnouncement,
    content:
      rawAnnouncement.content[context.language] ||
      rawAnnouncement.content["en"],
  }));
}

export function filterAnnouncements(
  announcements: Announcement[],
  context: AnnouncementsUserSettings
): Announcement[] {
  const { language, currencies, getDate } = context;

  const date = getDate();

  return announcements.filter((announcement) => {
    if (announcement.languages && !announcement.languages.includes(language)) {
      return false;
    }

    if (
      announcement.currencies &&
      !announcement.currencies.some((c) => currencies.includes(c))
    ) {
      return false;
    }

    const publishedAt = new Date(announcement.published_at);
    if (publishedAt > date) {
      return false;
    }

    if (announcement.expired_at && new Date(announcement.expired_at) < date) {
      return false;
    }

    return true;
  });
}
