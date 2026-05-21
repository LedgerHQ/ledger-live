import type { BlockOperation } from "@ledgerhq/coin-module-framework/api/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { EvmCoinConfig, setCoinConfig } from "../config";
import { UnsupportedRpcMethodError } from "../errors";
import { getInternalTransactionsByBlock } from "../network/explorer/etherscan";
import { getNodeApi } from "../network/node";
import {
  BlockByHeightResult,
  BlockReceiptInfo,
  ERC20Transfer,
  PrefetchedBlockTransaction,
  TraceBlockCallAction,
  TraceBlockItem,
  TransactionInfo,
} from "../network/node/types";
import { EtherscanInternalTransaction } from "../types";
import { safeEncodeEIP55 } from "../utils";
import { getBlock } from "./getBlock";
import { dropRootTraceDuplicates } from "./rootTraceDedup";

// fixme refactor this test
// use builder function to build the mocked return values

jest.mock("../network/node");
jest.mock("../network/explorer/etherscan", () => ({
  getInternalTransactionsByBlock: jest.fn().mockResolvedValue([]),
}));

describe("getBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const address1 = "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d";
  const address2 = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
  const erc20Address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

  function makeNodeBlock(overrides: Partial<BlockByHeightResult> = {}): BlockByHeightResult {
    return {
      hash: "0xabc123",
      height: 12345,
      timestamp: new Date("2025-01-15T10:30:00Z").getTime(),
      parentHash: "0xparent123",
      transactions: [],
      ...overrides,
    };
  }

  function makeNodeBlockTx(
    overrides: Partial<PrefetchedBlockTransaction> = {},
  ): PrefetchedBlockTransaction {
    return {
      hash: "0xtx1",
      value: "1000",
      from: address1,
      to: address2,
      gasPrice: "20000000000",
      ...overrides,
    };
  }

  function makeNodeBlockReceipt(overrides: Partial<BlockReceiptInfo> = {}): BlockReceiptInfo {
    return {
      hash: "0xtx1",
      gasUsed: "21000",
      gasPrice: "20000000000",
      status: 1,
      erc20Transfers: [],
      ...overrides,
    };
  }

  function makeNodeErc20Transfer(overrides: Partial<ERC20Transfer> = {}): ERC20Transfer {
    return {
      asset: { type: "erc20", assetReference: erc20Address },
      from: address1,
      to: address2,
      value: "1000000",
      ...overrides,
    };
  }

  function makeNodeTxInfo(overrides: Partial<TransactionInfo> = {}): TransactionInfo {
    return {
      hash: "0xtx1",
      blockHeight: 12345,
      blockHash: "0xabc123",
      nonce: 1,
      gasUsed: "21000",
      gasPrice: "20000000000",
      status: 1,
      value: "1000",
      from: address1,
      to: address2,
      erc20Transfers: [],
      ...overrides,
    };
  }

  function makeNodeTraceAction(
    overrides: Partial<TraceBlockCallAction> = {},
  ): TraceBlockCallAction {
    return {
      from: address1,
      to: address2,
      callType: "call",
      value: 240000481795678944n.toString(),
      ...overrides,
    };
  }

  function makeNodeTraceBlockItem(overrides: Partial<TraceBlockItem> = {}): TraceBlockItem {
    return {
      action: makeNodeTraceAction(),
      result: { gasUsed: "0", output: "0x" },
      blockHash: "0xabc",
      blockNumber: 12345,
      transactionHash: "0xtx1",
      transactionPosition: 0,
      traceAddress: [0],
      subtraces: 0,
      type: "call",
      ...overrides,
    };
  }

  it("returns block with transactions and ERC20 transfers using bulk receipts", async () => {
    setCoinConfig(
      () =>
        ({ info: { node: { type: "external" as const, retries: 0 } } }) as unknown as EvmCoinConfig,
    );

    const mockGetNodeApi = jest.mocked(getNodeApi);
    const mockGetBlockByHeight = jest.fn();
    mockGetBlockByHeight.mockResolvedValueOnce(
      makeNodeBlock({
        transactions: [
          makeNodeBlockTx({ hash: "0xtx1", from: address1, to: address2, value: "1000" }),
          makeNodeBlockTx({ hash: "0xtx2", from: address1, to: address2, value: "0" }),
        ],
      }),
    );
    const mockGetBlockReceipts = jest.fn().mockResolvedValue([
      makeNodeBlockReceipt({
        hash: "0xtx1",
        erc20Transfers: [makeNodeErc20Transfer({ from: address1, to: address2, value: "1000000" })],
      }),
      makeNodeBlockReceipt({
        hash: "0xtx2",
        erc20Transfers: [],
      }),
    ]);

    mockGetNodeApi.mockReturnValue({
      getBlockByHeight: mockGetBlockByHeight,
      getBlockReceipts: mockGetBlockReceipts,
      getTransaction: jest.fn(),
    } as any);

    const result = await getBlock({} as CryptoCurrency, 12345);

    expect(result).toMatchObject({
      info: {
        hash: "0xabc123",
        height: 12345,
        time: new Date("2025-01-15T10:30:00Z"),
        parent: {
          hash: "0xparent123",
          height: 12344,
        },
      },
      transactions: expect.arrayContaining([
        expect.objectContaining({
          hash: "0xtx1",
          operations: expect.arrayContaining([
            // Check native transfer operations (tx1 has value: 1000)
            expect.objectContaining({
              type: "transfer",
              address: address1,
              peer: address2,
              asset: { type: "native" },
              amount: -1000n,
            }),
            expect.objectContaining({
              type: "transfer",
              address: address2,
              peer: address1,
              asset: { type: "native" },
              amount: 1000n,
            }),
            // Check ERC20 transfer operations (tx1 has one ERC20 transfer)
            expect.objectContaining({
              type: "transfer",
              address: address1,
              peer: address2,
              asset: { type: "erc20", assetReference: erc20Address },
              amount: -1000000n,
            }),
            expect.objectContaining({
              type: "transfer",
              address: address2,
              peer: address1,
              asset: { type: "erc20", assetReference: erc20Address },
              amount: 1000000n,
            }),
          ]),
        }),
        // tx2 has no value and no ERC20 transfers
        expect.objectContaining({
          hash: "0xtx2",
          operations: [],
        }),
      ]),
    });
  });

  it("adds SmartContractInteraction details on prefetched tx with non-trivial input", async () => {
    setCoinConfig(
      () =>
        ({ info: { node: { type: "external" as const, retries: 0 } } }) as unknown as EvmCoinConfig,
    );

    const calldata = "0xa9059cbb00000000";
    const mockGetNodeApi = jest.mocked(getNodeApi);
    mockGetNodeApi.mockReturnValue({
      getBlockByHeight: jest.fn().mockResolvedValueOnce(
        makeNodeBlock({
          transactions: [
            makeNodeBlockTx({
              hash: "0xtx1",
              from: address1,
              to: address2,
              value: "0",
              input: calldata,
            }),
          ],
        }),
      ),
      getBlockReceipts: jest
        .fn()
        .mockResolvedValueOnce([makeNodeBlockReceipt({ hash: "0xtx1", erc20Transfers: [] })]),
      getTransaction: jest.fn(),
    } as any);

    const result = await getBlock({} as CryptoCurrency, 12345);

    expect(result.transactions[0]).toMatchObject({
      hash: "0xtx1",
      details: {
        contractInteraction: "SmartContractInteraction",
        contractAddress: safeEncodeEIP55(address2),
        contractPayload: calldata,
      },
    });
  });

  it("adds SmartContractDeployment details when prefetched tx has input but no to", async () => {
    setCoinConfig(
      () =>
        ({ info: { node: { type: "external" as const, retries: 0 } } }) as unknown as EvmCoinConfig,
    );

    const initCode = "0x6001600055";
    const mockGetNodeApi = jest.mocked(getNodeApi);
    mockGetNodeApi.mockReturnValue({
      getBlockByHeight: jest.fn().mockResolvedValueOnce(
        makeNodeBlock({
          transactions: [
            makeNodeBlockTx({
              hash: "0xdeploy",
              from: address1,
              to: undefined,
              value: "0",
              input: initCode,
            }),
          ],
        }),
      ),
      getBlockReceipts: jest
        .fn()
        .mockResolvedValueOnce([
          makeNodeBlockReceipt({ hash: "0xdeploy", erc20Transfers: [], contractAddress: address2 }),
        ]),
      getTransaction: jest.fn(),
    } as any);

    const result = await getBlock({} as CryptoCurrency, 12345);

    expect(result.transactions[0]).toMatchObject({
      hash: "0xdeploy",
      details: {
        contractInteraction: "SmartContractDeployment",
        contractAddress: safeEncodeEIP55(address2),
        contractPayload: initCode,
      },
    });
  });

  it("omits contract details for prefetched tx with trivial input", async () => {
    setCoinConfig(
      () =>
        ({ info: { node: { type: "external" as const, retries: 0 } } }) as unknown as EvmCoinConfig,
    );

    const mockGetNodeApi = jest.mocked(getNodeApi);
    mockGetNodeApi.mockReturnValue({
      getBlockByHeight: jest.fn().mockResolvedValueOnce(
        makeNodeBlock({
          transactions: [
            makeNodeBlockTx({
              hash: "0xtx1",
              input: "0x",
            }),
          ],
        }),
      ),
      getBlockReceipts: jest
        .fn()
        .mockResolvedValueOnce([makeNodeBlockReceipt({ hash: "0xtx1", erc20Transfers: [] })]),
      getTransaction: jest.fn(),
    } as any);

    const result = await getBlock({} as CryptoCurrency, 12345);

    expect({
      hash: result.transactions[0].hash,
      hasDetails: "details" in result.transactions[0],
    }).toEqual({ hash: "0xtx1", hasDetails: false });
  });

  it("adds contract details when falling back to getTransaction with non-trivial input", async () => {
    setCoinConfig(
      () =>
        ({ info: { node: { type: "external" as const, retries: 0 } } }) as unknown as EvmCoinConfig,
    );

    const calldata = "0xdeadbeef";
    const mockGetNodeApi = jest.mocked(getNodeApi);
    const mockGetBlockByHeight = jest.fn().mockResolvedValueOnce(
      makeNodeBlock({
        transactions: [makeNodeBlockTx({ hash: "0xtx1" })],
      }),
    );
    const mockGetBlockReceipts = jest.fn().mockRejectedValueOnce(
      new UnsupportedRpcMethodError("eth_getBlockReceipts is not supported by this RPC provider", {
        method: "eth_getBlockReceipts",
        rawError: { code: -32601 },
      }),
    );
    const mockGetTransaction = jest.fn().mockResolvedValueOnce(
      makeNodeTxInfo({
        hash: "0xtx1",
        value: "1000",
        to: address2,
        input: calldata,
      }),
    );

    mockGetNodeApi.mockReturnValue({
      getBlockByHeight: mockGetBlockByHeight,
      getBlockReceipts: mockGetBlockReceipts,
      getTransaction: mockGetTransaction,
    } as any);

    const result = await getBlock({} as CryptoCurrency, 12345);

    expect(result.transactions[0]).toMatchObject({
      hash: "0xtx1",
      details: {
        contractInteraction: "SmartContractInteraction",
        contractAddress: safeEncodeEIP55(address2),
        contractPayload: calldata,
      },
    });
  });

  it("falls back to per-transaction calls when bulk receipts are unavailable", async () => {
    setCoinConfig(
      () =>
        ({ info: { node: { type: "external" as const, retries: 0 } } }) as unknown as EvmCoinConfig,
    );

    const mockGetNodeApi = jest.mocked(getNodeApi);
    const mockGetBlockByHeight = jest.fn().mockResolvedValueOnce(
      makeNodeBlock({
        hash: "0xabc123",
        transactions: [makeNodeBlockTx({ hash: "0xtx1" })],
      }),
    );
    const mockGetBlockReceipts = jest.fn().mockRejectedValueOnce(
      new UnsupportedRpcMethodError("eth_getBlockReceipts is not supported by this RPC provider", {
        method: "eth_getBlockReceipts",
        rawError: { code: -32601 },
      }),
    );
    const mockGetTransaction = jest
      .fn()
      .mockResolvedValueOnce(makeNodeTxInfo({ hash: "0xtx1", value: "1000" }));

    mockGetNodeApi.mockReturnValue({
      getBlockByHeight: mockGetBlockByHeight,
      getBlockReceipts: mockGetBlockReceipts,
      getTransaction: mockGetTransaction,
    } as any);

    const result = await getBlock({} as CryptoCurrency, 12345);

    expect(result).toMatchObject({
      info: {
        height: 12345,
      },
      transactions: expect.arrayContaining([
        expect.objectContaining({
          hash: "0xtx1",
        }),
      ]),
    });
    expect(mockGetBlockReceipts).toHaveBeenCalledWith(expect.anything(), 12345);
    expect(mockGetTransaction).toHaveBeenCalledWith(expect.anything(), "0xtx1");
  });

  it("falls back to per-transaction calls when prefetchTxs is not supported", async () => {
    setCoinConfig(
      () =>
        ({ info: { node: { type: "external" as const, retries: 0 } } }) as unknown as EvmCoinConfig,
    );

    const mockGetNodeApi = jest.mocked(getNodeApi);
    const mockGetBlockByHeight = jest
      .fn()
      .mockResolvedValueOnce(makeNodeBlock({ hash: "0xabc123", transactionHashes: ["0xtx1"] }));
    const mockGetBlockReceipts = jest.fn();
    const mockGetTransaction = jest.fn().mockResolvedValueOnce(makeNodeTxInfo({ hash: "0xtx1" }));

    mockGetNodeApi.mockReturnValue({
      getBlockByHeight: mockGetBlockByHeight,
      getBlockReceipts: mockGetBlockReceipts,
      getTransaction: mockGetTransaction,
    } as any);

    const result = await getBlock({} as CryptoCurrency, 12345);

    expect(result).toMatchObject({
      info: {
        height: 12345,
      },
      transactions: expect.arrayContaining([
        expect.objectContaining({
          hash: "0xtx1",
        }),
      ]),
    });
    expect(mockGetBlockByHeight).toHaveBeenCalledWith(expect.anything(), 12345, true);
    expect(mockGetBlockReceipts).not.toHaveBeenCalled();
    expect(mockGetTransaction).toHaveBeenCalledWith(expect.anything(), "0xtx1");
  });

  it("does not fallback when getBlockReceipts fails for another reason", async () => {
    setCoinConfig(
      () =>
        ({ info: { node: { type: "external" as const, retries: 0 } } }) as unknown as EvmCoinConfig,
    );

    const mockGetNodeApi = jest.mocked(getNodeApi);
    const mockGetBlockByHeight = jest.fn().mockResolvedValueOnce(
      makeNodeBlock({
        height: 12345,
        transactions: [makeNodeBlockTx({ hash: "0xtx1" })],
      }),
    );
    const serverError = new Error("timeout");
    const mockGetBlockReceipts = jest.fn().mockRejectedValueOnce(serverError);
    const mockGetTransaction = jest.fn();

    mockGetNodeApi.mockReturnValue({
      getBlockByHeight: mockGetBlockByHeight,
      getBlockReceipts: mockGetBlockReceipts,
      getTransaction: mockGetTransaction,
    } as any);

    await expect(getBlock({} as CryptoCurrency, 12345)).rejects.toThrow("timeout");
    expect(mockGetTransaction).not.toHaveBeenCalled();
  });

  function makeExplorerInternalTransaction(
    overrides: Partial<EtherscanInternalTransaction> = {},
  ): EtherscanInternalTransaction {
    return {
      blockNumber: "12345",
      timeStamp: "1635100060",
      hash: "0xtx1",
      from: address1,
      to: address2,
      value: 240000481795678944n.toString(),
      contractAddress: "",
      input: "",
      type: "call",
      gas: "21000",
      gasUsed: "0",
      traceId: "0",
      isError: "0",
      errCode: "",
      ...overrides,
    };
  }

  it("merges internal transactions from explorer into block transactions", async () => {
    setCoinConfig(
      () =>
        ({
          info: {
            node: { type: "external" as const, retries: 0 },
            explorer: { type: "etherscan", uri: "https://api.etherscan.io" },
          },
        }) as unknown as EvmCoinConfig,
    );

    const mockGetNodeApi = jest.mocked(getNodeApi);
    const mockGetBlockByHeight = jest.fn().mockResolvedValueOnce(
      makeNodeBlock({
        transactions: [makeNodeBlockTx({ hash: "0xtx1", value: "0" })],
      }),
    );
    const mockGetBlockReceipts = jest
      .fn()
      .mockResolvedValue([makeNodeBlockReceipt({ hash: "0xtx1", erc20Transfers: [] })]);

    mockGetNodeApi.mockReturnValue({
      getBlockByHeight: mockGetBlockByHeight,
      getBlockReceipts: mockGetBlockReceipts,
      getTransaction: jest.fn(),
    } as any);

    const amount = 240000481795678944n;
    const mockGetInternalTransactionsByBlock = jest.mocked(getInternalTransactionsByBlock);
    mockGetInternalTransactionsByBlock.mockResolvedValueOnce([
      makeExplorerInternalTransaction({
        hash: "0xtx1",
        from: address1,
        to: address2,
        value: amount.toString(),
      }),
    ]);

    const result = await getBlock({} as CryptoCurrency, 12345);

    const encodedFrom = safeEncodeEIP55(address1);
    const encodedTo = safeEncodeEIP55(address2);
    expect(result).toMatchObject({
      info: {
        height: 12345,
      },
      transactions: expect.arrayContaining([
        expect.objectContaining({
          hash: "0xtx1",
          operations: expect.arrayContaining([
            expect.objectContaining({
              type: "transfer",
              address: encodedFrom,
              peer: encodedTo,
              asset: { type: "native" },
              amount: -amount,
            }),
            expect.objectContaining({
              type: "transfer",
              address: encodedTo,
              peer: encodedFrom,
              asset: { type: "native" },
              amount: amount,
            }),
          ]),
        }),
      ]),
    });
  });

  it("drops a root-trace internal transaction that duplicates the coin tx's native transfer", async () => {
    // Blockscout's `txlistinternal` exposes the top-level call of every tx as an internal transaction.
    // That entry has `from`, `to`, `value` identical to the coin tx's own native transfer, so merging
    // it naively would double-count the native transfer. The dedup in mergeInternalTransactions
    // drops internal native ops whose (address, peer, amount) match one of the coin tx's own.
    setCoinConfig(
      () =>
        ({
          info: {
            node: { type: "external" as const, retries: 0 },
            explorer: { type: "etherscan", uri: "https://api.etherscan.io" },
          },
        }) as unknown as EvmCoinConfig,
    );

    const amount = 200000000000000000n;
    const mockGetNodeApi = jest.mocked(getNodeApi);
    mockGetNodeApi.mockReturnValue({
      getBlockByHeight: jest.fn().mockResolvedValueOnce(
        makeNodeBlock({
          transactions: [makeNodeBlockTx({ hash: "0xtx1", value: amount.toString() })],
        }),
      ),
      getBlockReceipts: jest
        .fn()
        .mockResolvedValue([makeNodeBlockReceipt({ hash: "0xtx1", erc20Transfers: [] })]),
      getTransaction: jest.fn(),
    } as any);

    const mockGetInternalTransactionsByBlock = jest.mocked(getInternalTransactionsByBlock);
    mockGetInternalTransactionsByBlock.mockResolvedValueOnce([
      // Root-trace duplicate: same from/to/value as the coin tx.
      makeExplorerInternalTransaction({
        hash: "0xtx1",
        from: address1,
        to: address2,
        value: amount.toString(),
      }),
    ]);

    const result = await getBlock({} as CryptoCurrency, 12345);

    // Only the two ops from the coin tx itself (sender + recipient side), no duplicates.
    const nativeOps = result.transactions[0].operations.filter(
      op => op.type === "transfer" && op.asset.type === "native",
    );
    expect(nativeOps).toHaveLength(2);
  });

  it("keeps a nested internal transaction that does not match the coin tx's native transfer", async () => {
    // Sanity: when the explorer reports a legitimate subcall (different from/to than the coin tx),
    // it is kept alongside the coin tx's own native ops.
    setCoinConfig(
      () =>
        ({
          info: {
            node: { type: "external" as const, retries: 0 },
            explorer: { type: "etherscan", uri: "https://api.etherscan.io" },
          },
        }) as unknown as EvmCoinConfig,
    );

    // Same amount as the coin tx, on purpose: the match key is (address, peer, amount),
    // so a different peer must not collapse even when the amount matches.
    const coinAmount = 200000000000000000n;
    const nestedAmount = 200000000000000000n;
    const nestedRecipient = "0x330E16622F947CBBfA15aB2fdf83014EAa27eCd1";
    const mockGetNodeApi = jest.mocked(getNodeApi);
    mockGetNodeApi.mockReturnValue({
      getBlockByHeight: jest.fn().mockResolvedValueOnce(
        makeNodeBlock({
          transactions: [makeNodeBlockTx({ hash: "0xtx1", value: coinAmount.toString() })],
        }),
      ),
      getBlockReceipts: jest
        .fn()
        .mockResolvedValue([makeNodeBlockReceipt({ hash: "0xtx1", erc20Transfers: [] })]),
      getTransaction: jest.fn(),
    } as any);

    const mockGetInternalTransactionsByBlock = jest.mocked(getInternalTransactionsByBlock);
    mockGetInternalTransactionsByBlock.mockResolvedValueOnce([
      // Root-trace duplicate: filtered.
      makeExplorerInternalTransaction({
        hash: "0xtx1",
        from: address1,
        to: address2,
        value: coinAmount.toString(),
      }),
      // Nested subcall from the contract onwards: kept.
      makeExplorerInternalTransaction({
        hash: "0xtx1",
        from: address2,
        to: nestedRecipient,
        value: nestedAmount.toString(),
      }),
    ]);

    const result = await getBlock({} as CryptoCurrency, 12345);

    const nativeOps = result.transactions[0].operations.filter(
      op => op.type === "transfer" && op.asset.type === "native",
    );
    // 2 ops from the coin tx + 2 from the nested subcall = 4. Root-trace dup dropped.
    expect(nativeOps).toHaveLength(4);
    expect(nativeOps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          address: safeEncodeEIP55(address2),
          peer: safeEncodeEIP55(nestedRecipient),
          amount: -nestedAmount,
        }),
        expect.objectContaining({
          address: safeEncodeEIP55(nestedRecipient),
          peer: safeEncodeEIP55(address2),
          amount: nestedAmount,
        }),
      ]),
    );
  });

  it("when explorer is not etherscan like, fallbacks to node.traceBlock", async () => {
    setCoinConfig(
      () =>
        ({
          info: {
            node: { type: "external" as const, retries: 0 },
            explorer: { type: "ledger" },
          },
        }) as unknown as EvmCoinConfig,
    );

    const amount = 240000481795678944n;

    const mockTraceBlock = jest.fn().mockResolvedValue([
      makeNodeTraceBlockItem({
        action: makeNodeTraceAction({ from: address1, to: address2, value: amount.toString() }),
      }),
    ]);
    const mockGetNodeApi = jest.mocked(getNodeApi);
    mockGetNodeApi.mockReturnValue({
      getBlockByHeight: jest.fn().mockResolvedValue(
        makeNodeBlock({
          hash: "0xabc",
          transactions: [makeNodeBlockTx({ hash: "0xtx1" })],
        }),
      ),
      getBlockReceipts: jest.fn().mockResolvedValue([makeNodeBlockReceipt({ hash: "0xtx1" })]),
      getTransaction: jest.fn(),
      traceBlock: mockTraceBlock,
    } as any);

    const mockGetInternalTransactionsByBlock = jest.mocked(getInternalTransactionsByBlock);

    const result = await getBlock({} as CryptoCurrency, 12345);

    expect(mockGetInternalTransactionsByBlock).not.toHaveBeenCalled();
    expect(mockTraceBlock).toHaveBeenCalledWith(expect.anything(), 12345);

    const encodedFrom = safeEncodeEIP55(address1);
    const encodedTo = safeEncodeEIP55(address2);
    expect(result.transactions[0].operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "transfer",
          address: encodedFrom,
          peer: encodedTo,
          asset: { type: "native" },
          amount: -amount,
        }),
        expect.objectContaining({
          type: "transfer",
          address: encodedTo,
          peer: encodedFrom,
          asset: { type: "native" },
          amount: amount,
        }),
      ]),
    );
  });

  it("when traceBlock throws UnsupportedRpcMethodError, the exception is propagated so that the caller can retry to fetch the whole block", async () => {
    setCoinConfig(
      () =>
        ({
          info: {
            node: { type: "external" as const, retries: 0 },
            explorer: { type: "ledger" },
          },
        }) as unknown as EvmCoinConfig,
    );

    const error = new UnsupportedRpcMethodError(
      "trace_block is not supported by this RPC provider",
      {
        method: "trace_block",
        rawError: { code: -32601 },
      },
    );
    const mockTraceBlock = jest.fn().mockRejectedValue(error);
    const mockGetNodeApi = jest.mocked(getNodeApi);
    mockGetNodeApi.mockReturnValue({
      getBlockByHeight: jest.fn().mockResolvedValue(
        makeNodeBlock({
          hash: "0xabc",
          transactions: [makeNodeBlockTx({ hash: "0xtx1", value: "0" })],
        }),
      ),
      getBlockReceipts: jest.fn().mockResolvedValue([makeNodeBlockReceipt({ hash: "0xtx1" })]),
      getTransaction: jest.fn(),
      traceBlock: mockTraceBlock,
    } as any);
    const mockGetInternalTransactionsByBlock = jest.mocked(getInternalTransactionsByBlock);

    await expect(getBlock({} as CryptoCurrency, 12345)).rejects.toThrow(error);

    expect(mockGetInternalTransactionsByBlock).not.toHaveBeenCalled();
    expect(mockTraceBlock).toHaveBeenCalledWith(expect.anything(), 12345);
  });

  it("when explorer.getInternalTransactionsByBlock fails and node.traceBlock is undefined, returns block with no internal transactions", async () => {
    setCoinConfig(
      () =>
        ({
          info: {
            node: { type: "external" as const, retries: 0 },
            explorer: { type: "etherscan", uri: "https://api.etherscan.io" },
          },
        }) as unknown as EvmCoinConfig,
    );

    const mockGetNodeApi = jest.mocked(getNodeApi);
    mockGetNodeApi.mockReturnValue({
      getBlockByHeight: jest.fn().mockResolvedValue(
        makeNodeBlock({
          transactions: [makeNodeBlockTx({ hash: "0xtx1", value: "0" })],
        }),
      ),
      getBlockReceipts: jest
        .fn()
        .mockResolvedValue([makeNodeBlockReceipt({ hash: "0xtx1", erc20Transfers: [] })]),
      getTransaction: jest.fn(),
    } as any);

    const mockGetInternalTransactionsByBlock = jest.mocked(getInternalTransactionsByBlock);
    mockGetInternalTransactionsByBlock.mockRejectedValueOnce(new Error("explorer error"));

    const result = await getBlock({} as CryptoCurrency, 12345);

    expect(result).toMatchObject({
      info: {
        height: 12345,
      },
      transactions: expect.arrayContaining([
        expect.objectContaining({
          hash: "0xtx1",
          operations: [],
        }),
      ]),
    });
  });

  it("when getInternalTransactionsByBlock fails and traceBlock is defined, falls back to traceBlock for internal transactions", async () => {
    setCoinConfig(
      () =>
        ({
          info: {
            node: { type: "external" as const, retries: 0 },
            explorer: { type: "etherscan", uri: "https://api.etherscan.io" },
          },
        }) as unknown as EvmCoinConfig,
    );

    const amount = 240000481795678944n;
    const traceBlockItem = makeNodeTraceBlockItem({
      action: makeNodeTraceAction({ from: address1, to: address2, value: amount.toString() }),
    });

    const mockTraceBlock = jest.fn().mockResolvedValue([traceBlockItem]);
    const mockGetNodeApi = jest.mocked(getNodeApi);
    mockGetNodeApi.mockReturnValue({
      getBlockByHeight: jest.fn().mockResolvedValue(
        makeNodeBlock({
          transactions: [makeNodeBlockTx({ hash: "0xtx1", value: "0" })],
        }),
      ),
      getBlockReceipts: jest
        .fn()
        .mockResolvedValue([makeNodeBlockReceipt({ hash: "0xtx1", erc20Transfers: [] })]),
      getTransaction: jest.fn(),
      traceBlock: mockTraceBlock,
    } as any);

    const mockGetInternalTransactionsByBlock = jest.mocked(getInternalTransactionsByBlock);
    mockGetInternalTransactionsByBlock.mockRejectedValueOnce(new Error("explorer error"));

    const result = await getBlock({} as CryptoCurrency, 12345);

    expect(mockTraceBlock).toHaveBeenCalledWith(expect.anything(), 12345);
    const encodedFrom = safeEncodeEIP55(address1);
    const encodedTo = safeEncodeEIP55(address2);
    expect(result).toMatchObject({
      info: {
        height: 12345,
      },
      transactions: expect.arrayContaining([
        expect.objectContaining({
          hash: "0xtx1",
          operations: expect.arrayContaining([
            expect.objectContaining({
              type: "transfer",
              address: encodedFrom,
              peer: encodedTo,
              asset: { type: "native" },
              amount: -amount,
            }),
            expect.objectContaining({
              type: "transfer",
              address: encodedTo,
              peer: encodedFrom,
              asset: { type: "native" },
              amount: amount,
            }),
          ]),
        }),
      ]),
    });
  });

  it("when explorer.getInternalTransactionsByBlock fails and traceBlock rejects UnsupportedRpcMethodError, propagates the error", async () => {
    setCoinConfig(
      () =>
        ({
          info: {
            node: { type: "external" as const, retries: 0 },
            explorer: { type: "etherscan", uri: "https://api.etherscan.io" },
          },
        }) as unknown as EvmCoinConfig,
    );

    const error = new UnsupportedRpcMethodError(
      "trace_block is not supported by this RPC provider",
      {
        method: "trace_block",
        rawError: { code: -32601 },
      },
    );
    const mockTraceBlock = jest.fn().mockRejectedValue(error);
    const mockGetNodeApi = jest.mocked(getNodeApi);
    mockGetNodeApi.mockReturnValue({
      getBlockByHeight: jest.fn().mockResolvedValue(
        makeNodeBlock({
          transactions: [makeNodeBlockTx({ hash: "0xtx1", value: "0" })],
        }),
      ),
      getBlockReceipts: jest
        .fn()
        .mockResolvedValue([makeNodeBlockReceipt({ hash: "0xtx1", erc20Transfers: [] })]),
      getTransaction: jest.fn(),
      traceBlock: mockTraceBlock,
    } as any);

    const mockGetInternalTransactionsByBlock = jest.mocked(getInternalTransactionsByBlock);
    mockGetInternalTransactionsByBlock.mockRejectedValueOnce(new Error("explorer error"));

    await expect(getBlock({} as CryptoCurrency, 12345)).rejects.toThrow(error);

    expect(mockGetInternalTransactionsByBlock).toHaveBeenCalledWith(expect.anything(), 12345);
    expect(mockTraceBlock).toHaveBeenCalledWith(expect.anything(), 12345);
  });

  it("uses prefetched tx gasPrice as fallback when Cronos receipt omits effectiveGasPrice and gasPrice", async () => {
    setCoinConfig(
      () =>
        ({
          info: { node: { type: "external" as const, retries: 0 } },
        }) as unknown as EvmCoinConfig,
    );
    const gasUsed = 21000n;
    const txGasPrice = "568125000000";
    const mockGetNodeApi = jest.mocked(getNodeApi);
    mockGetNodeApi.mockReturnValue({
      getBlockByHeight: jest.fn().mockResolvedValueOnce(
        makeNodeBlock({
          transactions: [makeNodeBlockTx({ hash: "0xtx1", gasPrice: txGasPrice })],
        }),
      ),
      getBlockReceipts: jest.fn().mockResolvedValueOnce([
        makeNodeBlockReceipt({
          hash: "0xtx1",
          gasUsed: gasUsed.toString(),
          gasPrice: "0", // what getBlockReceipts returns for a Cronos receipt
          erc20Transfers: [],
        }),
      ]),
      getTransaction: jest.fn(),
    } as any);
    const result = await getBlock({} as CryptoCurrency, 12345);
    expect(result.transactions[0].fees).toEqual(21000n * 568125000000n);
  });

  it("uses receipt effectiveGasPrice over prefetched tx gasPrice on mainnet-shaped receipts", async () => {
    setCoinConfig(
      () =>
        ({
          info: { node: { type: "external" as const, retries: 0 } },
        }) as unknown as EvmCoinConfig,
    );
    const gasUsed = 21000n;
    const receiptEffectiveGasPrice = "1000000000"; // 1 Gwei — resolved from effectiveGasPrice by getBlockReceipts
    const txGasPrice = "568125000000"; // higher value in the prefetched tx — must NOT win
    const mockGetNodeApi = jest.mocked(getNodeApi);
    mockGetNodeApi.mockReturnValue({
      getBlockByHeight: jest.fn().mockResolvedValueOnce(
        makeNodeBlock({
          transactions: [makeNodeBlockTx({ hash: "0xtx1", gasPrice: txGasPrice })],
        }),
      ),
      getBlockReceipts: jest.fn().mockResolvedValueOnce([
        makeNodeBlockReceipt({
          hash: "0xtx1",
          gasUsed: gasUsed.toString(),
          gasPrice: receiptEffectiveGasPrice, // non-zero → receipt wins over tx.gasPrice
          erc20Transfers: [],
        }),
      ]),
      getTransaction: jest.fn(),
    } as any);
    const result = await getBlock({} as CryptoCurrency, 12345);
    expect(result.transactions[0].fees).toEqual(21000n * 1000000000n);
  });

  describe("zkSync L1→L2 priority transactions (receipt type 0xff)", () => {
    const USER = "0xbEB30f27e61eFFF46Aa27dcE18E23ee8D5A7c6a4";
    const L2_BASE_TOKEN = "0x000000000000000000000000000000000000800A";
    const MINT_PEER = "0x0000000000000000000000000000000000000000";
    const ZKSYNC = { id: "zksync" } as CryptoCurrency;

    function buildZksyncMocks(
      txOverrides: Partial<PrefetchedBlockTransaction>,
      receiptOverrides: Partial<BlockReceiptInfo>,
    ): void {
      setCoinConfig(
        () => ({ info: { node: { type: "external", retries: 0 } } }) as unknown as EvmCoinConfig,
      );
      const mockGetNodeApi = jest.mocked(getNodeApi);
      mockGetNodeApi.mockReturnValue({
        getBlockByHeight: jest
          .fn()
          .mockResolvedValue(
            makeNodeBlock({ transactions: [makeNodeBlockTx({ hash: "0xtx", ...txOverrides })] }),
          ),
        getBlockReceipts: jest
          .fn()
          .mockResolvedValue([makeNodeBlockReceipt({ hash: "0xtx", ...receiptOverrides })]),
        getTransaction: jest.fn(),
      } as any);
    }

    it("does not modify ops when receipt type is undefined (regular L2 tx)", async () => {
      buildZksyncMocks(
        { from: USER, to: USER, value: "270000000000000000" },
        {
          erc20Transfers: [
            {
              asset: { type: "erc20", assetReference: L2_BASE_TOKEN },
              from: USER,
              to: USER,
              value: "270000000000000000",
            },
          ],
        },
      );
      const result = await getBlock(ZKSYNC, 12345);
      expect(result.transactions[0].operations).toEqual([
        {
          type: "transfer",
          address: USER,
          peer: USER,
          asset: { type: "native" },
          amount: -270000000000000000n,
        },
        {
          type: "transfer",
          address: USER,
          peer: USER,
          asset: { type: "native" },
          amount: 270000000000000000n,
        },
        {
          type: "transfer",
          address: USER,
          peer: USER,
          asset: { type: "erc20", assetReference: L2_BASE_TOKEN },
          amount: -270000000000000000n,
        },
        {
          type: "transfer",
          address: USER,
          peer: USER,
          asset: { type: "erc20", assetReference: L2_BASE_TOKEN },
          amount: 270000000000000000n,
        },
      ]);
    });

    it("does not modify ops for receipt type 2 (EIP-1559)", async () => {
      buildZksyncMocks(
        { from: USER, to: USER, value: "270000000000000000" },
        { type: 2, erc20Transfers: [] },
      );
      const result = await getBlock(ZKSYNC, 12345);
      expect(result.transactions[0].operations).toEqual([
        {
          type: "transfer",
          address: USER,
          peer: USER,
          asset: { type: "native" },
          amount: -270000000000000000n,
        },
        {
          type: "transfer",
          address: USER,
          peer: USER,
          asset: { type: "native" },
          amount: 270000000000000000n,
        },
      ]);
    });

    it("drops native self pair and prepends a synthesized native credit (peer=0x0)", async () => {
      buildZksyncMocks(
        { from: USER, to: USER, value: "270000000000000000" },
        {
          type: 0xff,
          erc20Transfers: [
            // Transfer log (user → user, the on-chain self transfer)
            {
              asset: { type: "erc20", assetReference: L2_BASE_TOKEN },
              from: USER,
              to: USER,
              value: "270000000000000000",
            },
            // Mint event surfaced as Transfer(0x0 → user) by parseERC20TransfersFromLogs
            {
              asset: { type: "erc20", assetReference: L2_BASE_TOKEN },
              from: MINT_PEER,
              to: USER,
              value: "270000000000000000",
            },
          ],
        },
      );
      const result = await getBlock(ZKSYNC, 12345);
      expect(result.transactions[0].operations).toEqual([
        // native credit (synthesized, replaces the native self pair)
        {
          type: "transfer",
          address: USER,
          peer: MINT_PEER,
          asset: { type: "native" },
          amount: 270000000000000000n,
        },
        // 800A self pair (from Transfer log)
        {
          type: "transfer",
          address: USER,
          peer: USER,
          asset: { type: "erc20", assetReference: L2_BASE_TOKEN },
          amount: -270000000000000000n,
        },
        {
          type: "transfer",
          address: USER,
          peer: USER,
          asset: { type: "erc20", assetReference: L2_BASE_TOKEN },
          amount: 270000000000000000n,
        },
        // 800A credit (from Mint event, mint-source side on 0x0 is filtered out)
        {
          type: "transfer",
          address: USER,
          peer: MINT_PEER,
          asset: { type: "erc20", assetReference: L2_BASE_TOKEN },
          amount: 270000000000000000n,
        },
      ]);
    });

    it("prepends only a native credit when no L2BaseToken events are present (type 0xff)", async () => {
      buildZksyncMocks(
        { from: USER, to: USER, value: "270000000000000000" },
        { type: 0xff, erc20Transfers: [] },
      );
      const result = await getBlock(ZKSYNC, 12345);
      expect(result.transactions[0].operations).toEqual([
        {
          type: "transfer",
          address: USER,
          peer: MINT_PEER,
          asset: { type: "native" },
          amount: 270000000000000000n,
        },
      ]);
    });

    it("filters mint-source ops on 0x0 even when no native self pair is found (type 0xff)", async () => {
      buildZksyncMocks(
        { from: USER, to: USER, value: "0" },
        {
          type: 0xff,
          erc20Transfers: [
            // Mint-derived entry: would produce {0x0, peer: user, -V} + {user, peer: 0x0, +V}
            {
              asset: { type: "erc20", assetReference: L2_BASE_TOKEN },
              from: MINT_PEER,
              to: USER,
              value: "1000",
            },
          ],
        },
      );
      const result = await getBlock(ZKSYNC, 12345);
      // Only the to-side (on user) remains; the from-side (on 0x0) is filtered out.
      expect(result.transactions[0].operations).toEqual([
        {
          type: "transfer",
          address: USER,
          peer: MINT_PEER,
          asset: { type: "erc20", assetReference: L2_BASE_TOKEN },
          amount: 1000n,
        },
      ]);
    });

    it("leaves user ERC20 (non-800A) self transfers unchanged under type 0xff", async () => {
      const usdc = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
      buildZksyncMocks(
        { from: USER, to: USER, value: "0" },
        {
          type: 0xff,
          erc20Transfers: [
            {
              asset: { type: "erc20", assetReference: usdc },
              from: USER,
              to: USER,
              value: "1000000",
            },
          ],
        },
      );
      const result = await getBlock(ZKSYNC, 12345);
      expect(result.transactions[0].operations).toEqual([
        {
          type: "transfer",
          address: USER,
          peer: USER,
          asset: { type: "erc20", assetReference: usdc },
          amount: -1000000n,
        },
        {
          type: "transfer",
          address: USER,
          peer: USER,
          asset: { type: "erc20", assetReference: usdc },
          amount: 1000000n,
        },
      ]);
    });

    it("leaves 800A non-self transfers unchanged under type 0xff", async () => {
      const other = "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d";
      buildZksyncMocks(
        { from: USER, to: USER, value: "0" },
        {
          type: 0xff,
          erc20Transfers: [
            {
              asset: { type: "erc20", assetReference: L2_BASE_TOKEN },
              from: USER,
              to: other,
              value: "1000",
            },
          ],
        },
      );
      const result = await getBlock(ZKSYNC, 12345);
      expect(result.transactions[0].operations).toEqual([
        {
          type: "transfer",
          address: USER,
          peer: other,
          asset: { type: "erc20", assetReference: L2_BASE_TOKEN },
          amount: -1000n,
        },
        {
          type: "transfer",
          address: other,
          peer: USER,
          asset: { type: "erc20", assetReference: L2_BASE_TOKEN },
          amount: 1000n,
        },
      ]);
    });

    it("does not apply zkSync corrections to other currencies (e.g. ethereum) even when receipt type is 0xff", async () => {
      buildZksyncMocks(
        { from: USER, to: USER, value: "270000000000000000" },
        {
          type: 0xff,
          erc20Transfers: [
            {
              asset: { type: "erc20", assetReference: L2_BASE_TOKEN },
              from: USER,
              to: USER,
              value: "270000000000000000",
            },
          ],
        },
      );
      const result = await getBlock({ id: "ethereum" } as CryptoCurrency, 12345);
      expect(result.transactions[0].operations).toEqual([
        {
          type: "transfer",
          address: USER,
          peer: USER,
          asset: { type: "native" },
          amount: -270000000000000000n,
        },
        {
          type: "transfer",
          address: USER,
          peer: USER,
          asset: { type: "native" },
          amount: 270000000000000000n,
        },
        {
          type: "transfer",
          address: USER,
          peer: USER,
          asset: { type: "erc20", assetReference: L2_BASE_TOKEN },
          amount: -270000000000000000n,
        },
        {
          type: "transfer",
          address: USER,
          peer: USER,
          asset: { type: "erc20", assetReference: L2_BASE_TOKEN },
          amount: 270000000000000000n,
        },
      ]);
    });
  });
});

describe("dropRootTraceDuplicates", () => {
  const A = "0xAAAa1111111111111111111111111111aaaaaaaa";
  const B = "0xBBBb2222222222222222222222222222bbbbbbbb";
  const C = "0xCCCc3333333333333333333333333333cccccccc";

  function nativeTransfer(address: string, peer: string, amount: bigint): BlockOperation {
    return { type: "transfer", address, peer, asset: { type: "native" }, amount };
  }

  it("drops internal native ops that exactly match a coin native op", () => {
    const coinOps: BlockOperation[] = [nativeTransfer(A, B, -100n), nativeTransfer(B, A, 100n)];
    const internalOps: BlockOperation[] = [
      nativeTransfer(A, B, -100n), // root-trace duplicate
      nativeTransfer(B, A, 100n), // root-trace duplicate
    ];
    expect(dropRootTraceDuplicates(coinOps, internalOps)).toEqual([]);
  });

  it("keeps internal ops that differ in peer or amount", () => {
    const coinOps: BlockOperation[] = [nativeTransfer(A, B, -100n), nativeTransfer(B, A, 100n)];
    const internalOps: BlockOperation[] = [
      nativeTransfer(B, C, -100n), // nested subcall
      nativeTransfer(C, B, 100n),
    ];
    expect(dropRootTraceDuplicates(coinOps, internalOps)).toEqual(internalOps);
  });

  it("compares addresses case-insensitively", () => {
    const coinOps: BlockOperation[] = [nativeTransfer(A.toLowerCase(), B.toLowerCase(), -100n)];
    const internalOps: BlockOperation[] = [nativeTransfer(A.toUpperCase(), B.toUpperCase(), -100n)];
    expect(dropRootTraceDuplicates(coinOps, internalOps)).toEqual([]);
  });

  it("leaves ERC20 internal ops alone even when they share address/peer/amount with a native op", () => {
    const coinOps: BlockOperation[] = [nativeTransfer(A, B, -100n)];
    const erc20Op: BlockOperation = {
      type: "transfer",
      address: A,
      peer: B,
      asset: { type: "erc20", assetReference: "0xtoken", assetOwner: A },
      amount: -100n,
    };
    expect(dropRootTraceDuplicates(coinOps, [erc20Op])).toEqual([erc20Op]);
  });

  it("is a no-op when the coin tx has no native ops", () => {
    const internalOps: BlockOperation[] = [nativeTransfer(A, B, -100n)];
    expect(dropRootTraceDuplicates([], internalOps)).toEqual(internalOps);
  });

  it("drops only the native duplicate when native and ERC20 ops overlap on the same key", () => {
    // Regression: the ERC20 op shares (address, peer, amount) with the coin tx's native op.
    // The dedup narrows to native-asset ops, so the ERC20 entry must be preserved.
    const coinOps: BlockOperation[] = [nativeTransfer(A, B, -100n)];
    const erc20Op: BlockOperation = {
      type: "transfer",
      address: A,
      peer: B,
      asset: { type: "erc20", assetReference: "0xtoken", assetOwner: A },
      amount: -100n,
    };
    const nativeDup = nativeTransfer(A, B, -100n);
    const internalOps: BlockOperation[] = [nativeDup, erc20Op];
    expect(dropRootTraceDuplicates(coinOps, internalOps)).toEqual([erc20Op]);
  });

  it("treats ops with an undefined peer as matching each other", () => {
    // Some explorer/adapter shapes omit `peer` (e.g. the sender-side op when `to` is missing).
    // Two native ops that both omit `peer` with matching (address, amount) must still dedup.
    const coinOp: BlockOperation = {
      type: "transfer",
      address: A,
      asset: { type: "native" },
      amount: -100n,
    };
    const internalOp: BlockOperation = {
      type: "transfer",
      address: A,
      asset: { type: "native" },
      amount: -100n,
    };
    expect(dropRootTraceDuplicates([coinOp], [internalOp])).toEqual([]);
  });

  it("does NOT match when only one side has a peer", () => {
    // A coin op with peer B and an internal op without peer describe different transfers
    // and must not collapse into one.
    const coinOp: BlockOperation = nativeTransfer(A, B, -100n);
    const internalOpWithoutPeer: BlockOperation = {
      type: "transfer",
      address: A,
      asset: { type: "native" },
      amount: -100n,
    };
    expect(dropRootTraceDuplicates([coinOp], [internalOpWithoutPeer])).toEqual([
      internalOpWithoutPeer,
    ]);

    // Symmetric: coin without peer vs internal with peer.
    const coinOpWithoutPeer: BlockOperation = {
      type: "transfer",
      address: A,
      asset: { type: "native" },
      amount: -100n,
    };
    const internalOpWithPeer: BlockOperation = nativeTransfer(A, B, -100n);
    expect(dropRootTraceDuplicates([coinOpWithoutPeer], [internalOpWithPeer])).toEqual([
      internalOpWithPeer,
    ]);
  });
});
