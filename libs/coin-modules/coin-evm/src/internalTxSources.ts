export type NonEmptySource = "trace_block" | "debug_traceBlockByNumber" | "explorer";

export type InternalTxSource = NonEmptySource | "empty";

declare const brand: unique symbol;

export type InternalTxSourceList = readonly InternalTxSource[] & {
  readonly [brand]: "InternalTxSourceList";
};

export interface SealedBuilder {
  build(): InternalTxSourceList;
}

export interface OpenBuilder<Added extends NonEmptySource> {
  addSource<S extends Exclude<NonEmptySource, Added>>(source: S): OpenBuilder<Added | S>;
  addSource(source: "empty"): SealedBuilder;
  build(): InternalTxSourceList;
}

export interface InitialBuilder {
  addSource<S extends NonEmptySource>(source: S): OpenBuilder<S>;
  addSource(source: "empty"): SealedBuilder;
}

function finalize(sources: InternalTxSource[]): InternalTxSourceList {
  return sources as unknown as InternalTxSourceList;
}

class SealedBuilderImpl implements SealedBuilder {
  constructor(private readonly sources: InternalTxSource[]) {}

  build(): InternalTxSourceList {
    return finalize(this.sources);
  }
}

class OpenBuilderImpl<Added extends NonEmptySource> implements OpenBuilder<Added> {
  constructor(private readonly sources: InternalTxSource[]) {}

  addSource<S extends Exclude<NonEmptySource, Added>>(source: S): OpenBuilderImpl<Added | S>;
  addSource(source: "empty"): SealedBuilder;
  addSource(
    source: Exclude<NonEmptySource, Added> | "empty",
  ): OpenBuilderImpl<Added | Exclude<NonEmptySource, Added>> | SealedBuilder {
    if (source === "empty") {
      return new SealedBuilderImpl([...this.sources, source]);
    }
    return new OpenBuilderImpl([...this.sources, source]);
  }

  build(): InternalTxSourceList {
    return finalize(this.sources);
  }
}

class InitialBuilderImpl implements InitialBuilder {
  addSource<S extends NonEmptySource>(source: S): OpenBuilderImpl<S>;
  addSource(source: "empty"): SealedBuilder;
  addSource(source: NonEmptySource | "empty"): OpenBuilderImpl<NonEmptySource> | SealedBuilder {
    if (source === "empty") {
      return new SealedBuilderImpl([source]);
    }
    return new OpenBuilderImpl([source]);
  }
}

export function internalTxSources(): InitialBuilder {
  return new InitialBuilderImpl();
}

export const DEFAULT_INTERNAL_TX_SOURCES = internalTxSources()
  .addSource("explorer")
  .addSource("trace_block")
  .addSource("debug_traceBlockByNumber")
  .addSource("empty")
  .build();
