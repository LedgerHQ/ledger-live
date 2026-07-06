import { differenceInCalendarDays } from "date-fns";

export function isCooldownElapsed(
  onboardingDate: Date | null,
  cooldownDays: number,
  now: Date,
): boolean {
  if (onboardingDate === null) {
    return true;
  }

  return differenceInCalendarDays(now, onboardingDate) >= cooldownDays;
}

export function shouldThrottle(
  killsUpsellModal: number,
  lastSeenUpsellModal: Date | null,
  killThreshold: number,
  cadenceDays: number,
  now: Date,
): boolean {
  if (killsUpsellModal < killThreshold || lastSeenUpsellModal === null) {
    return false;
  }

  return differenceInCalendarDays(now, lastSeenUpsellModal) < cadenceDays;
}
