export type ScrubVariationPercentageUnit = "fraction" | "percentPoints";

type GetScrubVariationOptions = Readonly<{
  /** `fraction` (default): 0.1 = +10%. `percentPoints`: 10 = +10%. */
  percentageUnit?: ScrubVariationPercentageUnit;
}>;

/**
 * Variation between a range baseline and a scrubbed chart point.
 * `variationFiat` is the raw price delta; `percentage` unit is configurable.
 */
export function getScrubVariation(
  baselinePrice: number,
  scrubbedPrice: number,
  { percentageUnit = "fraction" }: GetScrubVariationOptions = {},
): { percentage: number; variationFiat: number } {
  const variationFiat = scrubbedPrice - baselinePrice;
  const ratio = baselinePrice === 0 ? 0 : variationFiat / baselinePrice;
  const percentage = percentageUnit === "percentPoints" ? ratio * 100 : ratio;
  return { percentage, variationFiat };
}
