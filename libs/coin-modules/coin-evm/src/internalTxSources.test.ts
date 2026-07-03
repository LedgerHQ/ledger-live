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
});
