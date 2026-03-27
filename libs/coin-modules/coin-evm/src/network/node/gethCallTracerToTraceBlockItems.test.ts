import flareBlock0x36ffc39CallTracerTrace from "./resources/flare-0x36ffc39-debug-trace-block-call-tracer.json";
import { gethCallTracerToTraceBlockItems } from "./gethCallTracerToTraceBlockItems";
import type { TraceBlockItem } from "./types";
import { isTraceBlockItem } from "./types";

describe("gethCallTracerToTraceBlockItems", () => {
  const blockNumber = 12345;

  it("flattens a nested call tree with traceAddress and subtraces ({ txHash, result } per tx)", () => {
    const nestedRoot = {
      type: "CALL",
      from: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      to: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      value: "0x10",
      gasUsed: "0x100",
      output: "0x",
      calls: [
        {
          type: "CALL",
          from: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          to: "0xcccccccccccccccccccccccccccccccccccccccc",
          value: "0x5",
          gasUsed: "0x50",
          output: "0x",
          calls: [],
        },
      ],
    };

    const expected: TraceBlockItem[] = [
      {
        action: {
          from: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          to: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          callType: "call",
          value: "0x10",
        },
        result: { gasUsed: "0x100", output: "0x" },
        blockNumber,
        transactionHash: "0xtx1",
        transactionPosition: 0,
        traceAddress: [],
        subtraces: 1,
        type: "call",
      },
      {
        action: {
          from: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          to: "0xcccccccccccccccccccccccccccccccccccccccc",
          callType: "call",
          value: "0x5",
        },
        result: { gasUsed: "0x50", output: "0x" },
        blockNumber,
        transactionHash: "0xtx1",
        transactionPosition: 0,
        traceAddress: [0],
        subtraces: 0,
        type: "call",
      },
    ];

    expect(
      gethCallTracerToTraceBlockItems(blockNumber, [{ txHash: "0xtx1", result: nestedRoot }]),
    ).toEqual(expected);
  });

  it("accepts transactionHash alias on the wrapper", () => {
    const inner = {
      type: "CALL",
      from: "0x1111111111111111111111111111111111111111",
      to: "0x2222222222222222222222222222222222222222",
      value: "0x0",
      gasUsed: "0x1",
      output: "0x",
      calls: [],
    };

    const expected: TraceBlockItem[] = [
      {
        action: {
          from: "0x1111111111111111111111111111111111111111",
          to: "0x2222222222222222222222222222222222222222",
          callType: "call",
          value: "0x0",
        },
        result: { gasUsed: "0x1", output: "0x" },
        blockNumber,
        transactionHash: "0xwrappedtx",
        transactionPosition: 0,
        traceAddress: [],
        subtraces: 0,
        type: "call",
      },
    ];

    expect(
      gethCallTracerToTraceBlockItems(blockNumber, [
        { transactionHash: "0xwrappedtx", result: inner },
      ]),
    ).toEqual(expected);
  });

  it("skips null top-level entries and maps wrapped txs in block order", () => {
    const debugTraceResults = [
      null,
      {
        txHash: "0xb",
        result: {
          type: "CALL",
          from: "0xbb",
          to: "0xcc",
          value: "0x1",
          gasUsed: "0x2",
          output: "0x",
          calls: [],
        },
      },
    ];

    expect(gethCallTracerToTraceBlockItems(blockNumber, debugTraceResults)).toEqual([
      {
        action: { from: "0xbb", to: "0xcc", callType: "call", value: "0x1" },
        result: { gasUsed: "0x2", output: "0x" },
        blockNumber,
        transactionHash: "0xb",
        transactionPosition: 1,
        traceAddress: [],
        subtraces: 0,
        type: "call",
      },
    ]);
  });

  it("throws when wrapped entry has null result", () => {
    expect(() =>
      gethCallTracerToTraceBlockItems(blockNumber, [{ txHash: "0xc", result: null }]),
    ).toThrow(/tx 0xc.*null or undefined "result"/);
  });

  it("throws when wrapped entry omits result", () => {
    expect(() => gethCallTracerToTraceBlockItems(blockNumber, [{ txHash: "0xd", foo: 1 }])).toThrow(
      /tx 0xd.*missing required "result"/,
    );
  });

  it("throws when entry is a plain call-tracer object without txHash wrapper", () => {
    expect(() =>
      gethCallTracerToTraceBlockItems(blockNumber, [
        {
          type: "CALL",
          from: "0x",
          to: "0x",
          calls: [],
        },
      ]),
    ).toThrow(/missing txHash/);
  });

  it("marks reverted frames with top-level error and null result", () => {
    const items = gethCallTracerToTraceBlockItems(blockNumber, [
      {
        txHash: "0xrev",
        result: {
          type: "CALL",
          from: "0x1",
          to: "0x2",
          value: "0x0",
          error: "Reverted",
          calls: [],
        },
      },
    ]);

    expect(items).toEqual([
      {
        action: { from: "0x1", to: "0x2", callType: "call", value: "0x0" },
        result: null,
        error: "Reverted",
        blockNumber,
        transactionHash: "0xrev",
        transactionPosition: 0,
        traceAddress: [],
        subtraces: 0,
        type: "call",
      },
    ]);
    expect(isTraceBlockItem(items[0])).toBe(true);
  });

  it("works on a real-life trace", () => {
    /**
     * Live capture from https://rpc.au.cc/flare ([flare public RPC](https://rpc.au.cc/flare)).
     *
     * 1) Current head (hex block height):
     * ```bash
     * curl -sS -X POST https://rpc.au.cc/flare -H 'Content-Type: application/json' \
     *   -d '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'
     * ```
     *
     * 2) `debug_traceBlockByHeight` is not implemented on this node (JSON-RPC -32601). The Geth-style
     * equivalent is `debug_traceBlockByNumber` with the same height as hex:
     * ```bash
     * curl -sS -X POST https://rpc.au.cc/flare -H 'Content-Type: application/json' \
     *   -d '{"jsonrpc":"2.0","id":2,"method":"debug_traceBlockByNumber","params":["0x36ffc39",{"tracer":"callTracer"}]}'
     * ```
     *
     * Fixture: `./fixtures/flare-0x36ffc39-debug-trace-block-call-tracer.json` — `result` array from
     * the response above (Flare block 0x36ffc39 / 57670713).
     */
    const blockNumber = 0x36ffc39;
    const debugTraceResults = flareBlock0x36ffc39CallTracerTrace.result;

    const items = gethCallTracerToTraceBlockItems(blockNumber, debugTraceResults);

    const txPositions = [
      ...new Set(items.map(i => i.transactionPosition).filter((p): p is number => p !== null)),
    ].sort((a, b) => a - b);

    expect({
      blockNumber,
      topLevelTxs: debugTraceResults.length,
      flattenedFrames: items.length,
      txPositions,
      firstRoot: {
        transactionHash: items[0]?.transactionHash,
        traceAddress: items[0]?.traceAddress,
        type: items[0]?.type,
        blockNumber: items[0]?.blockNumber,
      },
      allTraceBlockItems: items.every(i => isTraceBlockItem(i)),
    }).toEqual({
      blockNumber: 0x36ffc39,
      topLevelTxs: 2,
      flattenedFrames: 57,
      txPositions: [0, 1],
      firstRoot: {
        transactionHash: "0x2dc92b22902757ca658523cb0c58c2c0db3abf40f2270ec0f4f7facad87c6073",
        traceAddress: [],
        type: "call",
        blockNumber: 0x36ffc39,
      },
      allTraceBlockItems: true,
    });
  });
});
