export function meaningfulPercentage(
  deltaChange: number | null | undefined,
  balanceDivider: number | null | undefined,
  percentageHighThreshold = 100000,
): number | null | undefined {
  if (deltaChange && balanceDivider && balanceDivider !== 0) {
    const percent = deltaChange / balanceDivider;

    if (percent < percentageHighThreshold) {
      return percent;
    }
  }
}
