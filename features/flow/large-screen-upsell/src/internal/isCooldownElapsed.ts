const MS_PER_DAY = 86_400_000;

/** Local calendar-day difference (DST-safe), same idea as date-fns `differenceInCalendarDays`. */
function differenceInCalendarDays(later: Date, earlier: Date): number {
  const startOfLocalDayUtc = (date: Date) =>
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

  return Math.round((startOfLocalDayUtc(later) - startOfLocalDayUtc(earlier)) / MS_PER_DAY);
}

export function isCooldownElapsed({
  elapsedSinceDate,
  minimumDays,
  now,
}: {
  elapsedSinceDate: Date | null;
  minimumDays: number;
  now: Date;
}): boolean {
  if (elapsedSinceDate === null) {
    return true;
  }

  return differenceInCalendarDays(now, elapsedSinceDate) >= minimumDays;
}
