import { z } from "zod";
import { flagWith } from "../../define";

export const lldDatadog = flagWith(
  {
    sessionSamplingRate: z.number().optional(),
    sessionReplaySampleRate: z.number().optional(),
    defaultPrivacyLevel: z.string().optional(),
    traceSampleRate: z.number().optional(),
    allowedTracingUrls: z.array(z.string()).optional(),
    profilingSampleRate: z.number().optional(),
  },
  {
    enabled: false,
    params: {
      sessionSamplingRate: 100,
      sessionReplaySampleRate: 0,
      defaultPrivacyLevel: "mask-user-input",
      traceSampleRate: 100,
      allowedTracingUrls: ["/^https:\\/\\/[^/]+\\.ledger\\.com(\\/|$)/"],
      profilingSampleRate: 25,
    },
  },
);
