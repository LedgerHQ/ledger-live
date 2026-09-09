import type { Features } from "@shared/feature-flags";

const Q3_RELEASE_TOUR_VARIANTS = new Set(["q3_a", "q3_b", "q3_b2"]);

type ReleaseTourFlag = Features["releaseTour"] | null | undefined;

export function isQ2ReleaseTourEnabled(flag: ReleaseTourFlag): boolean {
  return flag?.enabled === true && flag.params?.variant === "q2";
}

export function isQ3ReleaseTourEnabled(flag: ReleaseTourFlag): boolean {
  const variant = flag?.params?.variant;
  return flag?.enabled === true && variant != null && Q3_RELEASE_TOUR_VARIANTS.has(variant);
}
