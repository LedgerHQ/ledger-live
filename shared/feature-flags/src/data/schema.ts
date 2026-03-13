import { z } from "zod";
import { FeatureValueSchema } from "./schema.base";
import * as flags from "../flags";

export { FeatureSchema, FeatureValueSchema, type Feature } from "./schema.base";

export const flagRegistry = flags;

export type FeatureId = keyof typeof flagRegistry;

export type Features = {
  [K in FeatureId]: z.infer<(typeof flagRegistry)[K]>;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const FeatureIdSchema = z.enum(Object.keys(flagRegistry) as FeatureId[]);

export type FeatureMap<T = Features[FeatureId]> = { [key in FeatureId]: T };
export type OptionalFeatureMap<T = Features[FeatureId]> = { [key in FeatureId]?: T };

export const FeatureFlagsStateSchema = z.object({
  overrides: z.partialRecord(FeatureIdSchema, FeatureValueSchema.optional()),
  resolved: z.record(FeatureIdSchema, FeatureValueSchema),
  bannerVisible: z.boolean(),
});

export type FeatureFlagsState = z.infer<typeof FeatureFlagsStateSchema>;
