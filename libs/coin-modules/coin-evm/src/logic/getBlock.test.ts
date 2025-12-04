import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { fetchWithRetries } from "../network/node/ledger";
import { getNodeApi } from "../network/node";
import { EvmCoinConfig, setCoinConfig } from "../config";
import { getBlock } from "./getBlock";

jest.mock("../network/node/ledger");
jest.mock("../network/node");

describe("getBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns block with transactions using an external node", async () => {
    setCoinConfig(() => ({ info: { node: { type: "external" } } }) as unknown as EvmCoinConfig);

    const mockGetNodeApi = jest.mocked(getNodeApi);
    const mockGetBlockByHeight = jest.fn();
    mockGetBlockByHeight
      .mockResolvedValueOnce({
        hash: "0xabc123",
        height: 12345,
        timestamp: new Date("2025-01-15T10:30:00Z").getTime(),
        transactionHashes: ["0xtx1", "0xtx2"],
      })
      .mockResolvedValueOnce({
        hash: "0xparent123",
        height: 12344,
        timestamp: new Date("2025-01-15T10:29:00Z").getTime(),
      });
    const mockGetTransaction = jest.fn();
    mockGetTransaction
      .mockResolvedValueOnce({
        hash: "0xtx1",
        blockHeight: 12345,
        blockHash: "0xabc123",
        nonce: 1,
        gasUsed: "21000",
        gasPrice: "20000000000",
        status: 1,
        value: "1000",
        from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
        to: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
      })
      .mockResolvedValueOnce({
        hash: "0xtx2",
        blockHeight: 12345,
        blockHash: "0xabc123",
        nonce: 2,
        gasUsed: "21000",
        gasPrice: "20000000000",
        status: 1,
        value: "2000",
        from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
        to: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
      });

    mockGetNodeApi.mockReturnValue({
      getBlockByHeight: mockGetBlockByHeight,
      getTransaction: mockGetTransaction,
    } as any);

    const result = await getBlock({} as CryptoCurrency, 12345);

    expect(result.info).toEqual({
      hash: "0xabc123",
      height: 12345,
      time: new Date("2025-01-15T10:30:00Z"),
      parent: {
        hash: "0xparent123",
        height: 12344,
        time: new Date("2025-01-15T10:29:00Z"),
      },
    });
    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0].hash).toBe("0xtx1");
    expect(result.transactions[0].operations.length).toBeGreaterThan(0);
  });

  it("returns block with transactions using a ledger node", async () => {
    setCoinConfig(
      () =>
        ({
          info: { node: { type: "ledger", explorerId: "eth" } },
        }) as unknown as EvmCoinConfig,
    );

    const mockGetNodeApi = jest.mocked(getNodeApi);
    const mockGetBlockByHeight = jest.fn();
    mockGetBlockByHeight
      .mockResolvedValueOnce({
        hash: "0xabc123",
        height: 12345,
        timestamp: new Date("2025-01-15T10:30:00Z").getTime(),
      })
      .mockResolvedValueOnce({
        hash: "0xparent123",
        height: 12344,
        timestamp: new Date("2025-01-15T10:29:00Z").getTime(),
      });
    mockGetNodeApi.mockReturnValue({
      getBlockByHeight: mockGetBlockByHeight,
    } as any);

    const mockFetchWithRetries = jest.mocked(fetchWithRetries);
    mockFetchWithRetries.mockResolvedValueOnce([
      {
        hash: "0xtx1",
        transaction_type: 2,
        nonce: "0x1",
        nonce_value: 1,
        value: "1000",
        gas: "21000",
        gas_price: "20000000000",
        max_fee_per_gas: null,
        max_priority_fee_per_gas: null,
        from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
        to: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
        transfer_events: [],
        erc721_transfer_events: [],
        erc1155_transfer_events: [],
        approval_events: [],
        actions: [],
        confirmations: 100,
        input: null,
        gas_used: "21000",
        cumulative_gas_used: "21000",
        status: 1,
        received_at: "2025-01-15T10:30:00Z",
        block: {
          hash: "0xabc123",
          height: 12345,
          time: "2025-01-15T10:30:00Z",
        },
      },
      {
        hash: "0xtx2",
        transaction_type: 2,
        nonce: "0x2",
        nonce_value: 2,
        value: "2000",
        gas: "21000",
        gas_price: "20000000000",
        max_fee_per_gas: null,
        max_priority_fee_per_gas: null,
        from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
        to: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
        transfer_events: [],
        erc721_transfer_events: [],
        erc1155_transfer_events: [],
        approval_events: [],
        actions: [],
        confirmations: 100,
        input: null,
        gas_used: "21000",
        cumulative_gas_used: "21000",
        status: 1,
        received_at: "2025-01-15T10:30:00Z",
        block: {
          hash: "0xabc123",
          height: 12345,
          time: "2025-01-15T10:30:00Z",
        },
      },
    ]);

    const result = await getBlock({} as CryptoCurrency, 12345);

    expect(result.info).toEqual({
      hash: "0xabc123",
      height: 12345,
      time: new Date("2025-01-15T10:30:00Z"),
      parent: {
        hash: "0xparent123",
        height: 12344,
        time: new Date("2025-01-15T10:29:00Z"),
      },
    });
    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0].hash).toBe("0xtx1");
    expect(result.transactions[1].hash).toBe("0xtx2");
  });
});
