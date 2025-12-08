import BigNumber from "bignumber.js";
import network from "@ledgerhq/live-network";
import { apiClient } from "./api";
import { getMockResponse } from "../test/fixtures/network.fixture";
import type {
  HederaMirrorContractCallResult,
  HederaMirrorNetworkFees,
  HederaMirrorTransaction,
} from "../types";

jest.mock("@ledgerhq/live-network");
const mockedNetwork = jest.mocked(network);

describe("getAccountTransactions", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should include 'account.id', 'limit=100' and 'order=desc' query params", async () => {
    mockedNetwork.mockResolvedValueOnce(
      getMockResponse({ transactions: [], links: { next: null } }),
    );

    await apiClient.getAccountTransactions({
      address: "0.0.1234",
      pagingToken: null,
      fetchAllPages: true,
    });

    const requestUrl = mockedNetwork.mock.calls[0][0].url;
    expect(requestUrl).toContain("account.id=0.0.1234");
    expect(requestUrl).toContain("limit=100");
    expect(requestUrl).toContain("order=desc");
  });

  it("should keep fetching if fetchAllPages is set and links.next is present", async () => {
    mockedNetwork
      .mockResolvedValueOnce(
        getMockResponse({
          transactions: [{ consensus_timestamp: "1" }],
          links: { next: "/next-1" },
        }),
      )
      .mockResolvedValueOnce(
        getMockResponse({
          transactions: [],
          links: { next: "/next-2" },
        }),
      )
      .mockResolvedValueOnce(
        getMockResponse({
          transactions: [{ consensus_timestamp: "3" }],
          links: { next: "/next-3" },
        }),
      )
      .mockResolvedValueOnce(
        getMockResponse({
          transactions: [{ consensus_timestamp: "4" }],
          links: { next: "/next-4" },
        }),
      )
      .mockResolvedValueOnce(
        getMockResponse({
          transactions: [],
          links: { next: null },
        }),
      );

    const result = await apiClient.getAccountTransactions({
      address: "0.0.1234",
      pagingToken: null,
      fetchAllPages: true,
    });

    expect(result.transactions.map(tx => tx.consensus_timestamp)).toEqual(["1", "3", "4"]);
    expect(result.nextCursor).toBeNull();
    expect(mockedNetwork).toHaveBeenCalledTimes(5);
  });

  it("should paginate if fetchAllPages is not set", async () => {
    mockedNetwork
      .mockResolvedValueOnce(
        getMockResponse({
          transactions: [{ consensus_timestamp: "1" }],
          links: { next: "/next-1" },
        }),
      )
      .mockResolvedValueOnce(
        getMockResponse({
          transactions: [],
          links: { next: "/next-2" },
        }),
      )
      .mockResolvedValueOnce(
        getMockResponse({
          transactions: [{ consensus_timestamp: "3" }],
          links: { next: "/next-3" },
        }),
      )
      .mockResolvedValueOnce(
        getMockResponse({
          transactions: [{ consensus_timestamp: "4" }],
          links: { next: "/next-4" },
        }),
      )
      .mockResolvedValueOnce(
        getMockResponse({
          transactions: [],
          links: { next: null },
        }),
      );

    const result = await apiClient.getAccountTransactions({
      address: "0.0.1234",
      pagingToken: null,
      limit: 2,
      fetchAllPages: false,
    });

    expect(result.transactions.map(tx => tx.consensus_timestamp)).toEqual(["1", "3"]);
    expect(result.nextCursor).toBe("3");
    expect(mockedNetwork).toHaveBeenCalledTimes(3);
  });
});

describe("getAccount", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should call the correct endpoint and return account data", async () => {
    mockedNetwork.mockResolvedValueOnce(
      getMockResponse({
        account: "0.0.1234",
        max_automatic_token_associations: 0,
        balance: {
          balance: 1000,
          timestamp: "1749047764.000113442",
          tokens: [],
        },
      }),
    );

    const result = await apiClient.getAccount("0.0.1234");
    const requestUrl = mockedNetwork.mock.calls[0][0].url;

    expect(result.account).toEqual("0.0.1234");
    expect(requestUrl).toContain("/api/v1/accounts/0.0.1234");
    expect(mockedNetwork).toHaveBeenCalledTimes(1);
  });
});

describe("getAccountTokens", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should return all tokens if only one page is needed", async () => {
    mockedNetwork.mockResolvedValueOnce(
      getMockResponse({
        tokens: [
          { token_id: "0.0.1001", balance: 10 },
          { token_id: "0.0.1002", balance: 20 },
        ],
        links: { next: null },
      }),
    );

    const result = await apiClient.getAccountTokens("0.0.1234");
    const requestUrl = mockedNetwork.mock.calls[0][0].url;

    expect(result.map(t => t.token_id)).toEqual(["0.0.1001", "0.0.1002"]);
    expect(requestUrl).toContain("/api/v1/accounts/0.0.1234/tokens");
    expect(requestUrl).toContain("limit=100");
    expect(mockedNetwork).toHaveBeenCalledTimes(1);
  });

  it("should keep fetching if links.next is present and new tokens are returned", async () => {
    mockedNetwork
      .mockResolvedValueOnce(
        getMockResponse({
          tokens: [{ token_id: "0.0.1001", balance: 10 }],
          links: { next: "/next-1" },
        }),
      )
      .mockResolvedValueOnce(
        getMockResponse({
          tokens: [{ token_id: "0.0.1002", balance: 20 }],
          links: { next: null },
        }),
      );

    const result = await apiClient.getAccountTokens("0.0.1234");

    expect(result.map(t => t.token_id)).toEqual(["0.0.1001", "0.0.1002"]);
    expect(mockedNetwork).toHaveBeenCalledTimes(2);
  });
});

describe("getNetworkFees", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call the correct endpoint and return network fees", async () => {
    const mockedResults: HederaMirrorNetworkFees = {
      fees: [{ gas: 39, transaction_type: "ContractCall" }],
      timestamp: "1758733200.632122898",
    };

    mockedNetwork.mockResolvedValueOnce(getMockResponse(mockedResults));

    const result = await apiClient.getNetworkFees();
    const requestUrl = mockedNetwork.mock.calls[0][0].url;

    expect(result).toEqual(mockedResults);
    expect(requestUrl).toContain("/api/v1/network/fees");
    expect(mockedNetwork).toHaveBeenCalledTimes(1);
  });
});

describe("getContractCallResult", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call the correct endpoint and return results for contract call", async () => {
    const mockedResults: HederaMirrorContractCallResult = {
      contract_id: "0.0.4321",
      block_gas_used: 100,
      gas_consumed: 200,
      gas_limit: 10000,
      gas_used: 150,
      timestamp: "xxxxxxxxx",
    };

    mockedNetwork.mockResolvedValueOnce(
      getMockResponse({
        contract_id: "0.0.4321",
        block_gas_used: 100,
        gas_consumed: 200,
        gas_limit: 10000,
        gas_used: 150,
        timestamp: "xxxxxxxxx",
      }),
    );

    const result = await apiClient.getContractCallResult(
      "0xa9059cbb000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000186a0",
    );
    const requestUrl = mockedNetwork.mock.calls[0][0].url;

    expect(result).toEqual(mockedResults);
    expect(requestUrl).toContain("/api/v1/contracts/results");
    expect(mockedNetwork).toHaveBeenCalledTimes(1);
  });
});

describe("findTransactionByContractCall", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call the correct endpoint and return transaction details", async () => {
    const mockedResults: HederaMirrorTransaction = {
      transfers: [],
      token_transfers: [],
      staking_reward_transfers: [],
      charged_tx_fee: 100,
      transaction_id: "xxxxxxxxxxxxxx",
      transaction_hash: "xxxxxxxxxxxxx",
      consensus_timestamp: "xxxxxxxxxxxxx",
      result: "xxxxxxxxxxxxx",
      entity_id: "0.0.1234",
      name: "CONTRACTCALL",
    };

    mockedNetwork.mockResolvedValueOnce(
      getMockResponse({
        transactions: [mockedResults],
      }),
    );

    const result = await apiClient.findTransactionByContractCall(
      "xxxxxxxxxxxxxxxxxxxx",
      "0.0.1234",
    );
    const requestUrl = mockedNetwork.mock.calls[0][0].url;

    expect(result).toEqual(mockedResults);
    expect(requestUrl).toContain("/api/v1/transactions?timestamp=");
    expect(mockedNetwork).toHaveBeenCalledTimes(1);
  });

  it("should call the correct endpoint and return null for non existing contract calls", async () => {
    mockedNetwork.mockResolvedValueOnce(
      getMockResponse({
        transactions: [
          {
            transfers: [],
            token_transfers: [],
            staking_reward_transfers: [],
            charged_tx_fee: 100,
            transaction_hash: "xxxxxxxxxxxxx",
            consensus_timestamp: "xxxxxxxxxxxxx",
            result: "xxxxxxxxxxxxx",
            entity_id: "0.0.1234",
            name: "NOT_CONTRACTCALL",
          },
          {
            transfers: [],
            token_transfers: [],
            staking_reward_transfers: [],
            charged_tx_fee: 100,
            transaction_hash: "xxxxxxxxxxxxx",
            consensus_timestamp: "xxxxxxxxxxxxx",
            result: "xxxxxxxxxxxxx",
            entity_id: "0.0.1111",
            name: "CONTRACTCALL",
          },
        ] satisfies Partial<HederaMirrorTransaction>[],
      }),
    );

    const result = await apiClient.findTransactionByContractCall(
      "xxxxxxxxxxxxxxxxxxxx",
      "0.0.1234",
    );
    const requestUrl = mockedNetwork.mock.calls[0][0].url;

    expect(result).toEqual(null);
    expect(requestUrl).toContain("/api/v1/transactions?timestamp=");
    expect(mockedNetwork).toHaveBeenCalledTimes(1);
  });

  it("should call the correct endpoint and return null for empty transactions list", async () => {
    mockedNetwork.mockResolvedValueOnce(
      getMockResponse({
        transactions: [],
      }),
    );

    const result = await apiClient.findTransactionByContractCall(
      "xxxxxxxxxxxxxxxxxxxx",
      "0.0.1234",
    );
    const requestUrl = mockedNetwork.mock.calls[0][0].url;

    expect(result).toEqual(null);
    expect(requestUrl).toContain("/api/v1/transactions?timestamp=");
    expect(mockedNetwork).toHaveBeenCalledTimes(1);
  });
});

describe("getERC20Balance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call the correct endpoint and return the contract balance", async () => {
    mockedNetwork.mockResolvedValueOnce(
      getMockResponse({
        result: "1000000000",
      }),
    );

    const result = await apiClient.getERC20Balance(
      "0x0000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000002",
    );
    const requestUrl = mockedNetwork.mock.calls[0][0].url;

    expect(result).toEqual(BigNumber("1000000000"));
    expect(requestUrl).toContain("/api/v1/contracts/call");
    expect(mockedNetwork).toHaveBeenCalledTimes(1);
  });
});

describe("estimateContractCallGas", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call the correct endpoint and return estimated contract call gas", async () => {
    mockedNetwork.mockResolvedValueOnce(
      getMockResponse({
        result: "1000000000",
      }),
    );

    const result = await apiClient.estimateContractCallGas(
      "0x0000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000002",
      "0xa9059cbb000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000186a0",
      BigInt(1000),
    );
    const requestUrl = mockedNetwork.mock.calls[0][0].url;

    expect(result).toEqual(BigNumber("1000000000"));
    expect(requestUrl).toContain("/api/v1/contracts/call");
    expect(mockedNetwork).toHaveBeenCalledTimes(1);
  });
});

describe("getTransactionsByTimestampRange", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should include correct query params with timestamp range", async () => {
    mockedNetwork.mockResolvedValueOnce(
      getMockResponse({ transactions: [], links: { next: null } }),
    );

    await apiClient.getTransactionsByTimestampRange("1000.000000000", "2000.000000000");

    const requestUrl = mockedNetwork.mock.calls[0][0].url;
    expect(requestUrl).toContain("timestamp=gte%3A1000.000000000");
    expect(requestUrl).toContain("timestamp=lt%3A2000.000000000");
    expect(requestUrl).toContain("limit=100");
    expect(requestUrl).toContain("order=desc");
  });

  it("should return empty array when no transactions found", async () => {
    mockedNetwork.mockResolvedValueOnce(
      getMockResponse({ transactions: [], links: { next: null } }),
    );

    const result = await apiClient.getTransactionsByTimestampRange(
      "1000.000000000",
      "2000.000000000",
    );

    expect(result).toEqual([]);
    expect(mockedNetwork).toHaveBeenCalledTimes(1);
  });

  it("should return all transactions when only one page is needed", async () => {
    mockedNetwork.mockResolvedValueOnce(
      getMockResponse({
        transactions: [
          { consensus_timestamp: "1500.123456789" },
          { consensus_timestamp: "1750.987654321" },
        ],
        links: { next: null },
      }),
    );

    const result = await apiClient.getTransactionsByTimestampRange(
      "1000.000000000",
      "2000.000000000",
    );

    expect(result.map(tx => tx.consensus_timestamp)).toEqual(["1500.123456789", "1750.987654321"]);
    expect(mockedNetwork).toHaveBeenCalledTimes(1);
  });

  it("should keep fetching all pages when links.next is present", async () => {
    mockedNetwork
      .mockResolvedValueOnce(
        getMockResponse({
          transactions: [{ consensus_timestamp: "1100.000000000" }],
          links: { next: "/next-1" },
        }),
      )
      .mockResolvedValueOnce(
        getMockResponse({
          transactions: [{ consensus_timestamp: "1200.000000000" }],
          links: { next: "/next-2" },
        }),
      )
      .mockResolvedValueOnce(
        getMockResponse({
          transactions: [{ consensus_timestamp: "1300.000000000" }],
          links: { next: null },
        }),
      );

    const result = await apiClient.getTransactionsByTimestampRange(
      "1000.000000000",
      "2000.000000000",
    );

    expect(result.map(tx => tx.consensus_timestamp)).toEqual([
      "1100.000000000",
      "1200.000000000",
      "1300.000000000",
    ]);
    expect(mockedNetwork).toHaveBeenCalledTimes(3);
  });

  it("should handle empty pages and continue fetching", async () => {
    mockedNetwork
      .mockResolvedValueOnce(
        getMockResponse({
          transactions: [{ consensus_timestamp: "1100.000000000" }],
          links: { next: "/next-1" },
        }),
      )
      .mockResolvedValueOnce(
        getMockResponse({
          transactions: [],
          links: { next: "/next-2" },
        }),
      )
      .mockResolvedValueOnce(
        getMockResponse({
          transactions: [{ consensus_timestamp: "1300.000000000" }],
          links: { next: null },
        }),
      );

    const result = await apiClient.getTransactionsByTimestampRange(
      "1000.000000000",
      "2000.000000000",
    );

    expect(result.map(tx => tx.consensus_timestamp)).toEqual(["1100.000000000", "1300.000000000"]);
    expect(mockedNetwork).toHaveBeenCalledTimes(3);
  });
});

describe("getNodes", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should return all nodes if only one page is needed", async () => {
    mockedNetwork.mockResolvedValueOnce(
      getMockResponse({
        nodes: [
          { node_id: 0, node_account_id: "0.0.3" },
          { node_id: 1, node_account_id: "0.0.4" },
        ],
        links: { next: null },
      }),
    );

    const result = await apiClient.getNodes();
    const requestUrl = mockedNetwork.mock.calls[0][0].url;

    expect(result.map(n => n.node_id)).toEqual([0, 1]);
    expect(requestUrl).toContain("/api/v1/network/nodes");
    expect(requestUrl).toContain("limit=100");
    expect(requestUrl).toContain("order=desc");
    expect(mockedNetwork).toHaveBeenCalledTimes(1);
  });

  it("should keep fetching if links.next is present and new nodes are returned", async () => {
    mockedNetwork
      .mockResolvedValueOnce(
        getMockResponse({
          nodes: [{ node_id: 0, node_account_id: "0.0.3" }],
          links: { next: "/next-1" },
        }),
      )
      .mockResolvedValueOnce(
        getMockResponse({
          nodes: [{ node_id: 1, node_account_id: "0.0.4" }],
          links: { next: "/next-2" },
        }),
      )
      .mockResolvedValueOnce(
        getMockResponse({
          nodes: [{ node_id: 2, node_account_id: "0.0.5" }],
          links: { next: null },
        }),
      );

    const result = await apiClient.getNodes();

    expect(result.map(n => n.node_id)).toEqual([0, 1, 2]);
    expect(mockedNetwork).toHaveBeenCalledTimes(3);
  });
});
