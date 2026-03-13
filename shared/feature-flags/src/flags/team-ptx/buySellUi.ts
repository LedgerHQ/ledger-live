import { z } from "zod";
import { flagWith } from "../../define";

export const buySellUi = flagWith(
  {
    manifestId: z.string(),
  },
  {
    enabled: false,
    params: { manifestId: "buy-sell-ui" },
  },
);
