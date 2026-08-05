import { z } from "zod";
import { flagWith } from "../../define";

export const lazyOnboardingBanner = flagWith(
  { mode: z.enum(["shop_direct", "feature_intro"]) },
  { enabled: false, params: { mode: "shop_direct" } },
);
