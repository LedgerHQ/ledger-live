import { z } from "zod";
import { flagWith } from "../../define";

export const mixpanelAnalytics = flagWith(
  {
    record_sessions_percent: z.number(),
  },
  {
    enabled: false,
    params: { record_sessions_percent: 100 },
  },
);
