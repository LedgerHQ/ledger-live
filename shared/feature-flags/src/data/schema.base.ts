import { z } from "zod";

// Base feature flag schema — shared foundation for both the flag definition
// helpers (`define.ts`) and the registry-derived types (`schema.ts`).
//
// Split from `schema.ts` to break a cyclic dependency: `define.ts` needs the
// base schema to build flag definitions, and `schema.ts` needs the flag
// definitions (via the registry) to derive `FeatureId` and `Features`.
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
