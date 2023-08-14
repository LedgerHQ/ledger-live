import type { Announcement } from "./types";

function startOfDayTime(date: string): number {
  const d = new Date(date);
  const startOfDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return startOfDate.getTime();
}

export const groupAnnouncements = (
  announcements: Announcement[],
): {
  day: Date | null | undefined;
  data: Announcement[];
}[] => {
  // first group by published_at or if theres a priority set
  const announcementsByDayOrPriority: Record<string, Announcement[]> = announcements.reduce(
    (sum, announcement: Announcement) => {
      // group by publication date or if priority set in a group 0
      const k = isNaN(announcement.priority as number)
        ? startOfDayTime(announcement.published_at)
        : 0;
      return { ...sum, [`${k}`]: [...(sum[k] || []), announcement] };
    },
    {},
  );
  // map over the keyed groups and sort them by priority and date
  return Object.keys(announcementsByDayOrPriority)
    .filter(
      key => announcementsByDayOrPriority[key] && announcementsByDayOrPriority[key].length > 0, // filter out potential empty groups
    )
    .map(key => Number(key)) // map every string to a number for sort evaluation
    .sort((a, b) => {
      const aa = a === 0 ? Infinity : a; // sort out by timestamp key while keeping priority set announcements on top

      const bb = b === 0 ? Infinity : b; // this can work because a and b cannot be equal to 0 at same time

      return bb - aa;
    })
    .map(date => ({
      day: date === 0 ? null : new Date(date),
      // format Day if available
      data: announcementsByDayOrPriority[`${date}`].sort(
        (a, b) => (a.priority || 0) - (b.priority || 0),
      ), // resort data by priority if it is set
    }));
};
