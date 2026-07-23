export type NonEmptySource = "trace_block" | "debug_traceBlockByNumber" | "explorer";

export type InternalTxSource = NonEmptySource | "empty";

declare const brand: unique symbol;

export type InternalTxSourceList = readonly InternalTxSource[] & {
  readonly [brand]: "InternalTxSourceList";
};

const ALL_SOURCES = new Set<string>([
  "trace_block",
  "debug_traceBlockByNumber",
  "explorer",
  "empty",
] satisfies ReadonlyArray<InternalTxSource>);

export function isInternalTxSource(value: string): value is InternalTxSource {
  return ALL_SOURCES.has(value);
}

/**
 * Runtime-checked construction from a dynamic (e.g. config-driven) list.
 * Enforces: non-empty, no duplicate non-empty sources, `empty` only as the final element.
 */
export function internalTxSourcesFromList(sources: readonly string[]): InternalTxSourceList {
  if (sources.length === 0) {
    throw new Error("internalTxSources: at least one source is required");
  }
  const seen = new Set<string>();
  sources.forEach((source, index) => {
    if (!isInternalTxSource(source)) {
      throw new Error(`internalTxSources: invalid source "${source}"`);
    }
    if (source === "empty" && index !== sources.length - 1) {
      throw new Error('internalTxSources: "empty" must be the last source');
    }
    if (source !== "empty") {
      if (seen.has(source)) throw new Error(`internalTxSources: duplicate source "${source}"`);
      seen.add(source);
    }
  });
  return Object.freeze([...sources]) as unknown as InternalTxSourceList;
}

export const DEFAULT_INTERNAL_TX_SOURCES = internalTxSourcesFromList([
  "explorer",
  "trace_block",
  "debug_traceBlockByNumber",
  "empty",
]);
