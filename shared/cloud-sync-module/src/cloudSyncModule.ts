import { ZodType, z } from "zod";

export interface CloudSyncDataManager<
  LocalState,
  Update,
  Schema extends ZodType,
  DistantState = z.infer<Schema>,
> {
  schema: Schema;
  diffLocalToDistant: (
    localData: LocalState,
    latestState: DistantState | null,
  ) => DistantDiff<DistantState>;
  resolveIncrementalUpdate: (
    localData: LocalState,
    latestState: DistantState | null,
    incomingState: DistantState | null,
  ) => Promise<UpdateDiff<Update>>;
  applyUpdate: (localData: LocalState, update: Update) => LocalState;
}

export type UpdateDiff<Update> = { hasChanges: false } | { hasChanges: true; update: Update };

export type DistantDiff<DistantState> = { hasChanges: boolean; nextState: DistantState };

/** a bag of module slices: nothing validates a document as a whole, on read or on write */
export type DistantDocument = Record<string, unknown>;

/** sound unlike a cast: any non-null non-array object is a bag of unknown values by key */
export function isDistantDocument(state: unknown): state is DistantDocument {
  return !!state && typeof state === "object" && !Array.isArray(state);
}

/** runtime defense: a document reaches us from the network or from rehydrated storage */
function asDocument(state: unknown): DistantDocument | null {
  return isDistantDocument(state) ? state : null;
}

export type ExtractLocalState<T> = T extends CloudSyncDataManager<infer L, any, any> ? L : never;
export type ExtractUpdateEvent<T> = T extends CloudSyncDataManager<any, infer U, any> ? U : never;
export type ExtractSchema<T> = T extends CloudSyncDataManager<any, any, infer S> ? S : never;
export type ExtractDistantState<T> =
  T extends CloudSyncDataManager<any, any, any, infer D> ? D : never;

/**
 * Everything a quarantine reports, and nothing else: the module and what kind of failure it was.
 * Never carries the offending value, and never wraps the original error as `cause` — a ZodError
 * stringifies to its issues, whose `path` is a record key, and an accountNames key is an account
 * id carrying the xpub. This reaches Datadog, so it stays free of any synced content.
 */
export class CloudSyncModuleQuarantined extends Error {
  override name = "CloudSyncModuleQuarantined";
  constructor(
    readonly moduleKey: string,
    readonly reason: string,
  ) {
    super(`cloud-sync module "${moduleKey}" quarantined: ${reason}`);
  }
}

/** a quarantined module stays frozen until data or code is fixed, so report this to logs/Sentry */
export type OnModuleError = (moduleKey: string, error: CloudSyncModuleQuarantined) => void;

/** the failure kind alone: zod codes are a fixed vocabulary, an error name is a class name */
function describeError(error: unknown): string {
  if (error instanceof z.ZodError) {
    const codes = Array.from(new Set(error.issues.map(issue => issue.code))).sort((a, b) =>
      a.localeCompare(b),
    );
    return codes.length ? `ZodError(${codes.join(", ")})` : "ZodError";
  }
  if (error instanceof Error) return error.name;
  return typeof error;
}

export type AggregatorOptions = {
  onModuleError?: OnModuleError;
};

type SliceRead = { ok: true; value: unknown } | { ok: false };

export function createAggregator<Mods extends Record<string, CloudSyncDataManager<any, any, any>>>(
  modules: Mods,
  options: AggregatorOptions = {},
) {
  const schema = z.object(mapValues(modules, m => z.optional(m.schema)));

  type Schema = typeof schema;
  // not `{ [K in keyof Mods]?: z.infer<Mods[K]["schema"]> }`: see DistantDocument
  type DistantState = DistantDocument;
  type LocalState = { [K in keyof Mods]: ExtractLocalState<Mods[K]> };
  type UpdateEvent = { [K in keyof Mods]: UpdateDiff<ExtractUpdateEvent<Mods[K]>> };

  const moduleKeys = Object.keys(modules) as (keyof Mods & string)[];

  // a quarantine repeats on every poll, so report each module once per kind of failure.
  // keyed on the failure kind, not the error message: a zod message is its issues serialized,
  // so it varies with the data and would grow this set on every poll for as long as the app runs.
  const reported = new Set<string>();

  const reportModuleError = (moduleKey: string, error: unknown) => {
    const reason = describeError(error);
    const key = `${moduleKey} ${reason}`;
    if (reported.has(key)) return;
    reported.add(key);
    // no console fallback: this package is platform-agnostic and consumers compile its source
    // with lib ES2022 only, and a recoverable quarantine must not pick their monitoring severity
    options.onModuleError?.(moduleKey, new CloudSyncModuleQuarantined(moduleKey, reason));
  };

  /** checks a slice against its module schema; a failing one must be skipped, never rewritten */
  function readSlice(key: keyof Mods & string, state: DistantDocument | null): SliceRead {
    if (state == null) return { ok: true, value: null };
    const raw = state[key];
    if (raw === undefined || raw === null) return { ok: true, value: null };
    const result = modules[key].schema.safeParse(raw);
    if (!result.success) {
      reportModuleError(key, result.error);
      return { ok: false };
    }
    // raw, not result.data: zod strips fields written by newer app versions
    return { ok: true, value: raw };
  }

  const root: CloudSyncDataManager<LocalState, UpdateEvent, Schema, DistantState> = {
    schema,

    diffLocalToDistant(localData, distantState) {
      const latestState = asDocument(distantState);
      let hasChanges = false;
      // seeding from latestState keeps unknown module keys and quarantined slices verbatim
      const nextState: DistantDocument = { ...latestState };
      for (const key of moduleKeys) {
        const slice = readSlice(key, latestState);
        if (!slice.ok) continue;
        try {
          const diff = modules[key].diffLocalToDistant(localData[key], slice.value);
          if (diff.hasChanges) hasChanges = true;
          nextState[key] = diff.nextState;
        } catch (error) {
          reportModuleError(key, error);
        }
      }
      return { hasChanges, nextState };
    },

    async resolveIncrementalUpdate(localData, distantLatestState, distantIncomingState) {
      const latestState = asDocument(distantLatestState);
      const incomingState = asDocument(distantIncomingState);
      const results = await Promise.allSettled(
        moduleKeys.map(async key => {
          const latest = readSlice(key, latestState);
          const incoming = readSlice(key, incomingState);
          // an unreadable incoming slice is the one with nothing to apply. an unreadable latest is
          // only a missing baseline, so treat it as absent: skipping on it would strand the module
          // once its stored slice was corrupt, since a later fixed document short-circuits on
          // latest === incoming and the data it skipped would never be applied
          if (!incoming.ok) return { hasChanges: false as const };
          return modules[key].resolveIncrementalUpdate(
            localData[key],
            latest.ok ? latest.value : null,
            incoming.value,
          );
        }),
      );
      let hasChanges = false;
      const update = {} as UpdateEvent;
      moduleKeys.forEach((key, i) => {
        const result = results[i];
        if (result.status === "rejected") {
          reportModuleError(key, result.reason);
          update[key] = { hasChanges: false };
          return;
        }
        update[key] = result.value;
        if (result.value.hasChanges) hasChanges = true;
      });
      return !hasChanges ? { hasChanges: false } : { hasChanges: true, update };
    },

    applyUpdate(localData, update) {
      return mapValues(modules, (m, key) => {
        const up = update[key];
        if (!up?.hasChanges) return localData[key];
        try {
          return m.applyUpdate(localData[key], up.update);
        } catch (error) {
          reportModuleError(key as string, error);
          return localData[key];
        }
      }) as LocalState;
    },
  };
  return root;
}

export function mapValues<T extends object, U>(
  obj: T,
  fn: (value: T[keyof T], key: keyof T) => U,
): { [K in keyof T]: U } {
  const result = {} as { [K in keyof T]: U };
  for (const key in obj) {
    result[key] = fn(obj[key], key);
  }
  return result;
}
