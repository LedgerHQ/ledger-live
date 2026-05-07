const SNAP_PERCENT_PER_STEP = 7.5;
const SNAP_PERCENT_OFFSET = 30;
const SNAP_PERCENT_MAX = 92;

export function getPostOnboardingHubSnapHeightPercent(
  totalSteps: number,
  areAllActionsCompleted: boolean,
): number {
  let percent = SNAP_PERCENT_OFFSET + totalSteps * SNAP_PERCENT_PER_STEP;
  if (areAllActionsCompleted) {
    percent += SNAP_PERCENT_PER_STEP;
  }
  return Math.min(SNAP_PERCENT_MAX, percent);
}
