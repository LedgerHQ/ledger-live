import { z } from "zod";
import { FeatureSchema } from "./data/schema.base";
import { type FlagMeta, flagMetaRegistry } from "./meta";

/**
 * For flags whose `params` are unknown.
 *
 * @param defaults
 * The default values for the feature.
 *
 * @param meta
 * Optional human/tool-facing metadata (description, owner, status, …). Registered alongside
 * the schema via {@link flagMetaRegistry} — it never affects the resolved flag value.
 *
 * @returns
 * The feature schema.
 */
export function flag(defaults: Partial<z.infer<typeof FeatureSchema>> = {}, meta?: FlagMeta) {
  const schema = FeatureSchema.extend({ params: z.unknown().optional() }).default({
    enabled: false,
    ...defaults,
  });
  return meta ? schema.register(flagMetaRegistry, meta) : schema;
}

/**
 * For flags whose `params` are a static object (fixed keys).
 *
 * @param params
 * The schema for the parameters. It should be a Zod object with fixed keys.
 *
 * @param defaults
 * The default values for the feature.
 *
 * @param meta
 * Optional human/tool-facing metadata (description, owner, status, …). Registered alongside
 * the schema via {@link flagMetaRegistry} — it never affects the resolved flag value.
 *
 * @returns
 * The feature schema.
 */
export function flagWith<P extends z.ZodRawShape>(
  params: P,
  defaults: Partial<z.infer<typeof FeatureSchema>> & { params?: z.output<z.ZodObject<P>> } = {},
  meta?: FlagMeta,
) {
  const schema = FeatureSchema.extend({ params: z.object(params).optional() }).default({
    enabled: false,
    ...defaults,
  });
  return meta ? schema.register(flagMetaRegistry, meta) : schema;
}

/**
 * For flags whose `params` are a record/dictionary (dynamic keys).
 *
 * @param paramsSchema
 * The schema for the parameters. It should be a Zod object with dynamic keys.
 *
 * @param defaults
 * The default values for the feature.
 *
 * @param meta
 * Optional human/tool-facing metadata (description, owner, status, …). Registered alongside
 * the schema via {@link flagMetaRegistry} — it never affects the resolved flag value.
 *
 * @returns
 * The feature schema.
 */
export function flagWithRecord<T extends z.ZodTypeAny>(
  paramsSchema: T,
  defaults: Partial<z.infer<typeof FeatureSchema>> & { params?: z.infer<T> } = {},
  meta?: FlagMeta,
) {
  const schema = FeatureSchema.extend({ params: paramsSchema.optional() }).default({
    enabled: false,
    ...defaults,
  });
  return meta ? schema.register(flagMetaRegistry, meta) : schema;
}
