import { z } from "zod";
import { flagWith } from "../../define";

const RELEASE_TOUR_VARIANTS = ["q2", "q3_a", "q3_b", "q3_b2"] as const;

const releaseTourVariantSchema = z.enum(RELEASE_TOUR_VARIANTS).optional();

export const releaseTour = flagWith(
  {
    variant: releaseTourVariantSchema,
  },
  {
    enabled: false,
    params: {
      variant: "q3_a",
    },
  },
);
