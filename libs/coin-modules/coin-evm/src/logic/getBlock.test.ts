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
});
