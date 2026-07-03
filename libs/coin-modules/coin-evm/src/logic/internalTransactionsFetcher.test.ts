import type { BlockOperation } from "@ledgerhq/coin-module-framework/api/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { EvmCoinConfig, internalTxSources, setCoinConfig } from "../config";
import { SourceUnavailableError } from "../errors";
import { getInternalTransactionsByBlock } from "../network/explorer/etherscan";
import { mockNodeApi } from "../network/node/node.fixtures";
import {
  composeInternalTxsFetcher,
  makeSourceFetchers,
  type SourceFetcher,
} from "./internalTransactionsFetcher";

jest.mock("../network/explorer/etherscan", () => ({
  getInternalTransactionsByBlock: jest.fn().mockResolvedValue([]),
}));

const rejectFetcher = () => Promise.reject(new Error("not implemented"));

function makeFetchers(
  overrides: Partial<
    Record<"trace_block" | "debug_traceBlockByNumber" | "explorer" | "empty", SourceFetcher>
  > = {},
): Record<"trace_block" | "debug_traceBlockByNumber" | "explorer" | "empty", SourceFetcher> {
  return {
    trace_block: rejectFetcher,
    debug_traceBlockByNumber: rejectFetcher,
    explorer: rejectFetcher,
    empty: async () => new Map(),
    ...overrides,
  };
}

describe("composeInternalTxsFetcher", () => {
  const height = 42;
  const explorerResult = new Map<string, BlockOperation[]>([["0x1", []]]);
  const traceResult = new Map<string, BlockOperation[]>([["0x2", []]]);

  it("uses the first source that resolves and does not call later sources", async () => {
    const explorer = jest.fn().mockResolvedValue(explorerResult);
    const traceBlock = jest.fn().mockResolvedValue(traceResult);
    const fetch = composeInternalTxsFetcher(
      ["explorer", "trace_block", "empty"],
      makeFetchers({ explorer, trace_block: traceBlock }),
    );

    await expect(fetch(height)).resolves.toBe(explorerResult);
    expect(explorer).toHaveBeenCalledWith(height);
    expect(traceBlock).not.toHaveBeenCalled();
  });

  it("falls through unavailable sources in order", async () => {
    const explorer = jest.fn().mockRejectedValue(new SourceUnavailableError("explorer down"));
    const traceBlock = jest.fn().mockResolvedValue(traceResult);
    const fetch = composeInternalTxsFetcher(
      ["explorer", "trace_block", "empty"],
      makeFetchers({ explorer, trace_block: traceBlock }),
    );

    await expect(fetch(height)).resolves.toBe(traceResult);
    expect(explorer).toHaveBeenCalledWith(height);
    expect(traceBlock).toHaveBeenCalledWith(height);
  });

  it("falls through real errors to the next source when empty is not yet reached", async () => {
    const explorer = jest.fn().mockRejectedValue(new Error("explorer down"));
    const traceBlock = jest.fn().mockResolvedValue(traceResult);
    const fetch = composeInternalTxsFetcher(
      ["explorer", "trace_block", "empty"],
      makeFetchers({ explorer, trace_block: traceBlock }),
    );

    await expect(fetch(height)).resolves.toBe(traceResult);
    expect(explorer).toHaveBeenCalledWith(height);
    expect(traceBlock).toHaveBeenCalledWith(height);
  });

  it("resolves to an empty map when unavailable sources are skipped and the list ends with empty", async () => {
    const explorer = jest.fn().mockRejectedValue(new SourceUnavailableError("explorer down"));
    const traceBlock = jest.fn().mockRejectedValue(new SourceUnavailableError("trace down"));
    const fetch = composeInternalTxsFetcher(
      ["explorer", "trace_block", "empty"],
      makeFetchers({ explorer, trace_block: traceBlock }),
    );

    await expect(fetch(height)).resolves.toEqual(new Map());
  });

  it("propagates a real error when the list ends with empty", async () => {
    const traceError = new Error("trace down");
    const fetch = composeInternalTxsFetcher(
      ["explorer", "trace_block", "empty"],
      makeFetchers({
        explorer: jest.fn().mockRejectedValue(new SourceUnavailableError("explorer down")),
        trace_block: jest.fn().mockRejectedValue(traceError),
      }),
    );

    await expect(fetch(height)).rejects.toThrow(traceError);
  });

  it("propagates the last rejection when empty is not configured", async () => {
    const lastError = new Error("trace down");
    const fetch = composeInternalTxsFetcher(
      internalTxSources().addSource("explorer").addSource("trace_block").build(),
      makeFetchers({
        explorer: jest.fn().mockRejectedValue(new Error("explorer down")),
        trace_block: jest.fn().mockRejectedValue(lastError),
      }),
    );

    await expect(fetch(height)).rejects.toThrow(lastError);
  });

  it("falls back from trace_block to debug_traceBlockByNumber", async () => {
    const gethResult = new Map<string, BlockOperation[]>([["0x3", []]]);
    const fetch = composeInternalTxsFetcher(
      internalTxSources().addSource("trace_block").addSource("debug_traceBlockByNumber").build(),
      makeFetchers({
        trace_block: jest.fn().mockRejectedValue(new Error("no erigon")),
        debug_traceBlockByNumber: jest.fn().mockResolvedValue(gethResult),
      }),
    );

    await expect(fetch(height)).resolves.toBe(gethResult);
  });

  it("throws when all sources are unavailable and empty is not configured", async () => {
    const fetch = composeInternalTxsFetcher(
      internalTxSources().addSource("trace_block").addSource("debug_traceBlockByNumber").build(),
      makeFetchers({
        trace_block: jest.fn().mockRejectedValue(new SourceUnavailableError("no erigon")),
        debug_traceBlockByNumber: jest
          .fn()
          .mockRejectedValue(new SourceUnavailableError("no geth")),
      }),
    );

    await expect(fetch(height)).rejects.toThrow("all internal tx sources unavailable");
  });
});

describe("makeSourceFetchers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects explorer when explorer config is not etherscan-like", async () => {
    setCoinConfig(
      () =>
        ({
          info: {
            node: { type: "external" as const, retries: 0 },
            explorer: { type: "ledger" },
          },
        }) as unknown as EvmCoinConfig,
    );

    const fetchers = makeSourceFetchers(mockNodeApi(), {} as CryptoCurrency);
    await expect(fetchers.explorer(1)).rejects.toBeInstanceOf(SourceUnavailableError);
  });

  it("rejects trace_block when traceBlockErigon is undefined", async () => {
    setCoinConfig(
      () =>
        ({
          info: { node: { type: "external" as const, retries: 0 } },
        }) as unknown as EvmCoinConfig,
    );

    const { traceBlockErigon: _traceBlockErigon, ...nodeApiWithoutErigon } = mockNodeApi();
    const fetchers = makeSourceFetchers(nodeApiWithoutErigon, {} as CryptoCurrency);
    await expect(fetchers.trace_block(1)).rejects.toBeInstanceOf(SourceUnavailableError);
  });

  it("wraps explorer runtime failures as SourceUnavailableError", async () => {
    setCoinConfig(
      () =>
        ({
          info: {
            node: { type: "external" as const, retries: 0 },
            explorer: { type: "etherscan", uri: "https://api.etherscan.io" },
          },
        }) as unknown as EvmCoinConfig,
    );

    const mockGetInternalTransactionsByBlock = jest.mocked(getInternalTransactionsByBlock);
    mockGetInternalTransactionsByBlock.mockRejectedValueOnce(new Error("explorer error"));

    const fetchers = makeSourceFetchers(mockNodeApi(), { id: "ethereum" } as CryptoCurrency);
    await expect(fetchers.explorer(99)).rejects.toBeInstanceOf(SourceUnavailableError);
  });

  it("calls getInternalTransactionsByBlock for explorer when configured", async () => {
    setCoinConfig(
      () =>
        ({
          info: {
            node: { type: "external" as const, retries: 0 },
            explorer: { type: "etherscan", uri: "https://api.etherscan.io" },
          },
        }) as unknown as EvmCoinConfig,
    );

    const mockGetInternalTransactionsByBlock = jest.mocked(getInternalTransactionsByBlock);
    mockGetInternalTransactionsByBlock.mockResolvedValueOnce([]);

    const fetchers = makeSourceFetchers(mockNodeApi(), { id: "ethereum" } as CryptoCurrency);
    await fetchers.explorer(99);

    expect(mockGetInternalTransactionsByBlock).toHaveBeenCalledWith({ id: "ethereum" }, 99);
  });

  it("empty always resolves to an empty map", async () => {
    setCoinConfig(
      () =>
        ({
          info: { node: { type: "external" as const, retries: 0 } },
        }) as unknown as EvmCoinConfig,
    );

    const fetchers = makeSourceFetchers(mockNodeApi(), {} as CryptoCurrency);
    await expect(fetchers.empty(1)).resolves.toEqual(new Map<string, BlockOperation[]>());
  });
});
