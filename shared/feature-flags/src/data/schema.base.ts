import { z } from "zod";

export const FeatureSchema = z.object({
  enabled: z.boolean(),
  desktop_version: z.string().optional(),
  mobile_version: z.string().optional(),
  enabledOverriddenForCurrentVersion: z.boolean().optional(),
  languages_whitelisted: z.array(z.string()).optional(),
  languages_blacklisted: z.array(z.string()).optional(),
  enabledOverriddenForCurrentLanguage: z.boolean().optional(),
  overridesRemote: z.boolean().optional(),
  overriddenByEnv: z.boolean().optional(),
});

export type Feature<T = unknown> = z.infer<typeof FeatureSchema> & { params?: T };
