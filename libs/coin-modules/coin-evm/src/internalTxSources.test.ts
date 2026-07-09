import {
  DEFAULT_INTERNAL_TX_SOURCES,
  internalTxSources,
  type InternalTxSourceList,
} from "./internalTxSources";

describe("internalTxSources", () => {
  it("builds the default explorer-first strategy", () => {
    expect(DEFAULT_INTERNAL_TX_SOURCES).toEqual([
      "explorer",
      "trace_block",
      "debug_traceBlockByNumber",
      "empty",
    ]);
  });

  it("builds a node-only strategy without empty", () => {
    const sources: InternalTxSourceList = internalTxSources()
      .addSource("trace_block")
      .addSource("debug_traceBlockByNumber")
      .build();

    expect(sources).toEqual(["trace_block", "debug_traceBlockByNumber"]);
  });

  it("builds explorer-only strategy", () => {
    const sources = internalTxSources().addSource("explorer").build();
    expect(sources).toEqual(["explorer"]);
  });

  it("allows empty as the only source", () => {
    const sources = internalTxSources().addSource("empty").build();
    expect(sources).toEqual(["empty"]);
  });

  // The following invalid usages are prevented at compile time by the builder's
  // interface state machine. The `@ts-expect-error` assertions are enforced by
  // `tsc --noEmit` (typecheck), which fails if any of them stops being an error.
  describe("rejects invalid source lists at compile time", () => {
    it("rejects an empty list: build() is unavailable before any source is added", () => {
      const builder = internalTxSources();
      // @ts-expect-error - InitialBuilder exposes no build(): at least one source is required
      builder.build();
    });

    it("rejects adding a source after empty: empty must be last", () => {
      const sealed = internalTxSources().addSource("empty");
      // @ts-expect-error - SealedBuilder is terminal: nothing may follow "empty"
      sealed.addSource("explorer");
    });

    it("rejects duplicate sources", () => {
      // @ts-expect-error - "explorer" was already added; duplicates are not allowed
      internalTxSources().addSource("explorer").addSource("explorer").build();
    });

    it("rejects unknown sources", () => {
      // @ts-expect-error - "bogus" is not a valid InternalTxSource
      internalTxSources().addSource("bogus");
    });

    it("rejects raw arrays bypassing the builder", () => {
      const raw = ["explorer", "empty"] as const;
      // @ts-expect-error - InternalTxSourceList is branded; only build() can produce it
      const sources: InternalTxSourceList = raw;
      void sources;
    });
  });
});
