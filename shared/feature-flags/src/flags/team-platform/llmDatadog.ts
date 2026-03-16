import { z } from "zod";
import { flagWith } from "../../define";

export const llmDatadog = flagWith(
  {
    batchProcessingLevel: z.enum(["MEDIUM", "HIGH", "LOW"]).optional(),
    batchSize: z.enum(["LARGE", "MEDIUM", "SMALL"]).optional(),
    bundleLogsWithRum: z.boolean().optional(),
    bundleLogsWithTraces: z.boolean().optional(),
    longTaskThresholdMs: z.union([z.number(), z.literal(false)]).optional(),
    nativeInteractionTracking: z.boolean().optional(),
    nativeLongTaskThresholdMs: z.union([z.number(), z.literal(false)]).optional(),
    nativeViewTracking: z.boolean().optional(),
    resourceTracingSamplingRate: z.number().optional(),
    serviceName: z.string().optional(),
    sessionSamplingRate: z.number().optional(),
    trackBackgroundEvents: z.boolean().optional(),
    trackFrustrations: z.boolean().optional(),
    trackErrors: z.boolean().optional(),
    trackResources: z.boolean().optional(),
    trackInteractions: z.boolean().optional(),
    trackWatchdogTerminations: z.boolean().optional(),
    uploadFrequency: z.enum(["AVERAGE", "FREQUENT", "RARE"]).optional(),
    vitalsUpdateFrequency: z
      .enum(["AVERAGE", "FREQUENT", "RARE", "NEVER"])
      .optional(),
  },
  {
    enabled: false,
    params: {
      batchProcessingLevel: "MEDIUM",
      batchSize: "MEDIUM",
      bundleLogsWithRum: true,
      bundleLogsWithTraces: true,
      longTaskThresholdMs: 0,
      nativeInteractionTracking: false,
      nativeLongTaskThresholdMs: 0,
      nativeViewTracking: false,
      resourceTracingSamplingRate: 0,
      serviceName: "Ledger Live Mobile (default)",
      sessionSamplingRate: 0,
      trackBackgroundEvents: false,
      trackFrustrations: true,
      trackErrors: false,
      trackResources: false,
      trackInteractions: false,
      trackWatchdogTerminations: false,
      uploadFrequency: "AVERAGE",
      vitalsUpdateFrequency: "AVERAGE",
    },
  },
);
