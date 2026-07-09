export type NonEmptySource = "trace_block" | "debug_traceBlockByNumber" | "explorer";

export type InternalTxSource = NonEmptySource | "empty";

declare const brand: unique symbol;

export type InternalTxSourceList = readonly InternalTxSource[] & {
  readonly [brand]: "InternalTxSourceList";
};

/** No source chosen yet: at least one source must be added (hence no `build`). */
export interface InitialBuilder {
  addSource<S extends NonEmptySource>(source: S): OpenBuilder<S>;
  addSource(source: "empty"): SealedBuilder;
}

/** At least one non-empty source added; more can be added, but no duplicates. */
export interface OpenBuilder<Added extends NonEmptySource> {
  addSource<S extends Exclude<NonEmptySource, Added>>(source: S): OpenBuilder<Added | S>;
  addSource(source: "empty"): SealedBuilder;
  build(): InternalTxSourceList;
}

/** Terminated by `empty`: nothing may follow. */
export interface SealedBuilder {
  build(): InternalTxSourceList;
}

// The compile-time state machine lives entirely in the interfaces above; at
// runtime building the list is just appending to an array.
class Builder {
  constructor(private readonly sources: readonly InternalTxSource[] = []) {}

  addSource(source: InternalTxSource): Builder {
    return new Builder([...this.sources, source]);
  }

  build(): InternalTxSourceList {
    return this.sources as unknown as InternalTxSourceList;
  }
}

export function internalTxSources(): InitialBuilder {
  return new Builder() as unknown as InitialBuilder;
}

export const DEFAULT_INTERNAL_TX_SOURCES = internalTxSources()
  .addSource("explorer")
  .addSource("trace_block")
  .addSource("debug_traceBlockByNumber")
  .addSource("empty")
  .build();
