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

  it("skips null / empty roots and maps multiple txs", () => {
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
      { txHash: "0xc", result: null },
    ];

    const items = gethCallTracerToTraceBlockItems(blockNumber, debugTraceResults);

    expect(items).toEqual([
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
});
