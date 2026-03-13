import { z } from "zod";
import { FeatureSchema } from "./schema.base";
import * as flags from "../flags";

export { FeatureSchema, type Feature } from "./schema.base";

export const flagRegistry = flags;

export type FeatureId = keyof typeof flagRegistry;

export type Features = {
  [K in FeatureId]: z.infer<(typeof flagRegistry)[K]>;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const FeatureIdSchema = z.enum(Object.keys(flagRegistry) as FeatureId[]);

export type FeatureMap<T = Features[FeatureId]> = { [key in FeatureId]: T };
export type OptionalFeatureMap<T = Features[FeatureId]> = { [key in FeatureId]?: T };

export type FeatureFlagsState = {
  overrides: { [K in FeatureId]?: Features[K] };
  resolved: Features;
  bannerVisible: boolean;
};

const FlagRegistrySchema = z.object(flagRegistry);
const OverrideValueSchema = FeatureSchema.extend({ params: z.unknown().optional() });

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const FeatureFlagsStateSchema = z.object({
  overrides: z.record(z.string(), OverrideValueSchema.optional()).default({}),
  resolved: FlagRegistrySchema,
  bannerVisible: z.boolean(),
}) as z.ZodType<FeatureFlagsState>;
