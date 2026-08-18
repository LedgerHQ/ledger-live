import { z } from "zod";
import { flagWith } from "../../define";

const DEFAULT_LINK = "https://shop.ledger.com/";

const httpsUrl = z
  .string()
  .trim()
  .url()
  .refine(link => link.startsWith("https://"), "Expected an HTTPS URL");

export const lazyOnboardingBanner = flagWith(
  {
    mode: z.enum(["shop_direct", "feature_intro"]),
    link: httpsUrl.default(DEFAULT_LINK),
  },
  {
    enabled: false,
    params: { mode: "shop_direct", link: DEFAULT_LINK },
  },
);
