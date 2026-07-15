// TODO: move this to a shared @shared/date package instead of importing date-fns directly here
import { differenceInCalendarDays } from "date-fns";

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
