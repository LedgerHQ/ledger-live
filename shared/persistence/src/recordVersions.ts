import { z } from "zod";
import { NewerRecordVersionError, RecordDecodeError } from "./errors";
import { toRecordDecodeError } from "./toRecordDecodeError";

type SchemaFactory<T> = (zod: typeof z) => z.ZodType<T>;

/** The stored versions of 1 record, from v0 to the latest, and the steps between them. */
export type RecordVersions<Latest> = Readonly<{
  /** The latest version: 0 with no `.next`. */
  latest: number;
  /** The stored schema of each version: the bare v0 schema, then a strict `{ $v: n, data }`. */
  storedSchemas: ReadonlyArray<z.ZodType>;
  /** Adds the next version: its schema, and a pure step from the previous version to it. */
  next<Next>(
    schema: SchemaFactory<Next>,
    step: (previous: Latest) => NoInfer<Next>,
  ): RecordVersions<Next>;
  /** Upgrades a stored value of any known version to the latest. Checks `$v` before any schema. */
  decode(stored: unknown, key: string): Latest;
  /** The stored value of the latest version: bare at v0, `{ $v: latest, data }` after. */
  encode(latest: Latest): unknown;
  /** The payload of a stored value of any version, newer included. */
  payloadOf(stored: unknown): unknown;
}>;

type Upgrade<Latest> = (storedVersion: number, stored: unknown, key: string) => Latest;

type Chain<Latest> = {
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

function payloadOf(stored: unknown): unknown {
  if (!isEnvelope(stored)) return stored;
  return "data" in stored ? stored.data : undefined;
}

function fromChain<Latest>(chain: Chain<Latest>): RecordVersions<Latest> {
  return Object.freeze({
    latest: chain.latest,
    storedSchemas: chain.storedSchemas,

    next<Next>(
      schemaFactory: SchemaFactory<Next>,
      step: (previous: Latest) => NoInfer<Next>,
    ): RecordVersions<Next> {
      const version = chain.latest + 1;
      const schema = schemaFactory(z);
      const storedSchema = z.strictObject({ $v: z.literal(version), data: schema });
      const upgrade: Upgrade<Next> = (storedVersion, stored, key) =>
        storedVersion === version
          ? parse(storedSchema, stored, key, version).data
          : runStep(step, chain.upgrade(storedVersion, stored, key), key, version);
      return fromChain({
        latest: version,
        schema,
        storedSchemas: Object.freeze([...chain.storedSchemas, storedSchema]),
        upgrade,
      });
    },

    decode(stored: unknown, key: string): Latest {
      const storedVersion = storedVersionOf(stored, key, chain.latest);
      if (storedVersion > chain.latest) {
        throw new NewerRecordVersionError(key, chain.latest, storedVersion);
      }
      const upgraded = chain.upgrade(storedVersion, stored, key);
      const stepsRan = storedVersion < chain.latest;
      return stepsRan ? parse(chain.schema, upgraded, key, chain.latest) : upgraded;
    },

    encode: (latest: Latest): unknown =>
      chain.latest === 0 ? latest : { $v: chain.latest, data: latest },

    payloadOf,
  });
}

/** The versions of a record, starting with v0: the bare stored shape, with no `$v`. */
export function recordVersions<V0>(schemaFactory: SchemaFactory<V0>): RecordVersions<V0> {
  const schema = schemaFactory(z);
  return fromChain({
    latest: 0,
    schema,
    storedSchemas: Object.freeze([schema]),
    upgrade: (_storedVersion, stored, key) => parse(schema, stored, key, 0),
  });
}
