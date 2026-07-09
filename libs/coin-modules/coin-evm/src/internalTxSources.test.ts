import {
  DEFAULT_INTERNAL_TX_SOURCES,
  internalTxSourcesFromList,
  type InternalTxSourceList,
} from "./internalTxSources";

describe("internalTxSourcesFromList", () => {
  it("builds the default explorer-first strategy", () => {
    expect(DEFAULT_INTERNAL_TX_SOURCES).toEqual([
      "explorer",
      "trace_block",
      "debug_traceBlockByNumber",
      "empty",
    ]);
  });

  it("builds a node-only strategy without empty", () => {
    const sources: InternalTxSourceList = internalTxSourcesFromList([
      "trace_block",
      "debug_traceBlockByNumber",
    ]);

    expect(sources).toEqual(["trace_block", "debug_traceBlockByNumber"]);
  });

  it("builds explorer-only strategy", () => {
    const sources = internalTxSourcesFromList(["explorer"]);
    expect(sources).toEqual(["explorer"]);
  });

  it("allows empty as the only source", () => {
    const sources = internalTxSourcesFromList(["empty"]);
    expect(sources).toEqual(["empty"]);
  });

  describe("rejects invalid source lists at runtime", () => {
    it("rejects an empty list", () => {
      expect(() => internalTxSourcesFromList([])).toThrow(
        "internalTxSources: at least one source is required",
      );
    });

    it("rejects adding a source after empty: empty must be last", () => {
      expect(() => internalTxSourcesFromList(["empty", "explorer"])).toThrow(
        'internalTxSources: "empty" must be the last source',
      );
    });

    it("rejects duplicate sources", () => {
      expect(() => internalTxSourcesFromList(["explorer", "explorer"])).toThrow(
        'internalTxSources: duplicate source "explorer"',
      );
    });

    it("rejects unknown sources", () => {
      expect(() => internalTxSourcesFromList(["bogus"])).toThrow(
        'internalTxSources: invalid source "bogus"',
      );
    });

    it("rejects raw arrays bypassing the builder", () => {
      const raw = ["explorer", "empty"] as const;
      // @ts-expect-error - InternalTxSourceList is branded; only internalTxSourcesFromList can produce it
      const sources: InternalTxSourceList = raw;
      void sources;
    });
  });
});
