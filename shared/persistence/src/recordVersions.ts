import { z } from "zod";
import { NewerRecordVersionError, RecordDecodeError } from "./errors";
import { toRecordDecodeError } from "./internals/toRecordDecodeError";

type SchemaFactory<T> = (zod: typeof z) => z.ZodType<T>;

export type RecordVersions<Latest> = Readonly<{
  latest: number;
  /** The bare v0 schema, then a strict `{ $v: n, data }` for each next version. */
  storedSchemas: ReadonlyArray<z.ZodType>;
  next<Next>(
    schema: SchemaFactory<Next>,
    step: (previous: Latest) => NoInfer<Next>,
  ): RecordVersions<Next>;
  /** Checks `$v` before any schema. */
  decode(stored: unknown, key: string): Latest;
  encode(latest: Latest): unknown;
}>;

type Upgrade<Latest> = (storedVersion: number, stored: unknown, key: string) => Latest;

type MigrationChain<Latest> = {
  latest: number;
  schema: z.ZodType<Latest>;
  storedSchemas: ReadonlyArray<z.ZodType>;
  upgrade: Upgrade<Latest>;
};

function parse<T>(schema: z.ZodType<T>, value: unknown, key: string, version: number): T {
  const result = schema.safeParse(value);
  if (!result.success) throw toRecordDecodeError(key, version, result.error.issues);
  return result.data;
}

function runStep<Previous, Next>(
  step: (previous: Previous) => Next,
  previous: Previous,
  key: string,
  version: number,
): Next {
  try {
    return step(previous);
  } catch (error) {
    const name = error instanceof Error ? error.name : typeof error;
    throw new RecordDecodeError(key, version, `the step to v${version} threw ${name}`);
  }
}

const isEnvelope = (stored: unknown): stored is { $v: unknown } =>
  typeof stored === "object" &&
  stored !== null &&
  !Array.isArray(stored) &&
  Object.hasOwn(stored, "$v");

function storedVersionOf(stored: unknown, key: string, latest: number): number {
  if (!isEnvelope(stored)) return 0;
  const version = stored.$v;
  const isValidVersion = typeof version === "number" && Number.isInteger(version) && version >= 1;
  if (!isValidVersion) throw new RecordDecodeError(key, latest, "$v: invalid");
  return version;
}

function fromMigrationChain<Latest>(
  migrationChain: MigrationChain<Latest>,
): RecordVersions<Latest> {
  return Object.freeze({
    latest: migrationChain.latest,
    storedSchemas: migrationChain.storedSchemas,

    next<Next>(
      schemaFactory: SchemaFactory<Next>,
      step: (previous: Latest) => NoInfer<Next>,
    ): RecordVersions<Next> {
      const version = migrationChain.latest + 1;
      const schema = schemaFactory(z);
      const storedSchema = z.strictObject({ $v: z.literal(version), data: schema });
      const upgrade: Upgrade<Next> = (storedVersion, stored, key) =>
        storedVersion === version
          ? parse(storedSchema, stored, key, version).data
          : runStep(step, migrationChain.upgrade(storedVersion, stored, key), key, version);
      return fromMigrationChain({
        latest: version,
        schema,
        storedSchemas: Object.freeze([...migrationChain.storedSchemas, storedSchema]),
        upgrade,
      });
    },

    decode(stored: unknown, key: string): Latest {
      const storedVersion = storedVersionOf(stored, key, migrationChain.latest);
      if (storedVersion > migrationChain.latest) {
        throw new NewerRecordVersionError(key, migrationChain.latest, storedVersion);
      }
      const upgraded = migrationChain.upgrade(storedVersion, stored, key);
      const stepsRan = storedVersion < migrationChain.latest;
      return stepsRan
        ? parse(migrationChain.schema, upgraded, key, migrationChain.latest)
        : upgraded;
    },

    encode: (latest: Latest): unknown =>
      migrationChain.latest === 0 ? latest : { $v: migrationChain.latest, data: latest },
  });
}

/** Starts at v0: the bare stored shape, with no `$v`. */
export function recordVersions<V0>(schemaFactory: SchemaFactory<V0>): RecordVersions<V0> {
  const schema = schemaFactory(z);
  return fromMigrationChain({
    latest: 0,
    schema,
    storedSchemas: Object.freeze([schema]),
    upgrade: (_storedVersion, stored, key) => parse(schema, stored, key, 0),
  });
}
