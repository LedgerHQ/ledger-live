import BigNumber from "bignumber.js";
import network from "@ledgerhq/live-network";
import coinConfig from "../config";
import { hgraphClient } from "./hgraph";
import { getMockResponse } from "../test/fixtures/network.fixture";
import { mockCoinConfig } from "../test/fixtures/config.fixture";
import { getMockedCurrency } from "../test/fixtures/currency.fixture";

jest.mock("@ledgerhq/live-network");
const mockedNetwork = jest.mocked(network);

describe("hgraphClient", () => {
  const mockCurrency = getMockedCurrency();

  beforeAll(() => {
    coinConfig.setCoinConfig(mockCoinConfig);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("getLastestIndexedConsensusTimestamp", () => {
    it("should fetch and return the latest indexed consensus timestamp", async () => {
      const mockTimestamp = "1234567890123456789";
      mockedNetwork.mockResolvedValueOnce(
        getMockResponse({
          data: {
            ethereum_transaction: [{ consensus_timestamp: mockTimestamp }],
          },
        }),
      );

      const result = await hgraphClient.getLastestIndexedConsensusTimestamp({
        currency: mockCurrency,
      });

      expect(mockedNetwork).toHaveBeenCalledTimes(1);
      expect(result).toEqual(new BigNumber(mockTimestamp));
    });

    it("should throw error when API returns errors", async () => {
      mockedNetwork.mockResolvedValueOnce(
        getMockResponse({
          errors: [{ message: "Database error" }],
        }),
      );

      await expect(
        hgraphClient.getLastestIndexedConsensusTimestamp({ currency: mockCurrency }),
      ).rejects.toThrow();
    });

    it("should throw error when no transactions found", async () => {
      mockedNetwork.mockResolvedValueOnce(
        getMockResponse({
          data: {
            ethereum_transaction: [],
          },
        }),
      );

      await expect(
        hgraphClient.getLastestIndexedConsensusTimestamp({ currency: mockCurrency }),
      ).rejects.toThrow();
    });
  });

  describe("getERC20Balances", () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it("should fetch and return ERC20 balances for an account", async () => {
      const mockAddress = "0.0.1234";
      const mockBalances = [
        {
          token_id: "0.0.5001",
          balance: "1000000",
          balance_timestamp: "1234567890.123456789",
          created_timestamp: "1234567800.000000000",
        },
        {
          token_id: "0.0.5002",
          balance: "2000000",
          balance_timestamp: "1234567890.123456789",
          created_timestamp: "1234567800.000000000",
        },
      ];

      mockedNetwork.mockResolvedValueOnce(
        getMockResponse({
          data: {
            erc_token_account: mockBalances,
          },
        }),
      );

      const result = await hgraphClient.getERC20Balances({
        currency: mockCurrency,
        address: mockAddress,
      });

      const queryVariables = mockedNetwork.mock.calls[0][0].data.variables;
      expect(mockedNetwork).toHaveBeenCalledTimes(1);
      expect(queryVariables.accountId).toBe("1234");
      expect(result).toEqual(mockBalances);
    });

    it("should extract account ID correctly from address", async () => {
      mockedNetwork.mockResolvedValueOnce(
        getMockResponse({
          data: {
            erc_token_account: [],
          },
        }),
      );

      await hgraphClient.getERC20Balances({
        currency: mockCurrency,
        address: "0.0.9999",
      });

      expect(mockedNetwork.mock.calls[0][0].data.variables.accountId).toBe("9999");
    });

    it("should throw error when API returns errors", async () => {
      mockedNetwork.mockResolvedValueOnce(
        getMockResponse({
          errors: [{ message: "Account not found" }],
        }),
      );

      await expect(
        hgraphClient.getERC20Balances({ currency: mockCurrency, address: "0.0.1234" }),
      ).rejects.toThrow();
    });
  });

  describe("getERC20Transfers", () => {
    it("should return empty array when no token addresses provided", async () => {
      const result = await hgraphClient.getERC20Transfers({
        currency: mockCurrency,
        address: "0.0.1234",
        tokenEvmAddresses: [],
        fetchAllPages: true,
      });

      expect(mockedNetwork).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("should fetch transfers with default parameters", async () => {
      const mockTransfer = {
        token_id: "0.0.5001",
        token_evm_address: "0xabc123",
        sender_evm_address: "0x111",
        sender_account_id: "0.0.1234",
        receiver_evm_address: "0x222",
        receiver_account_id: "0.0.5678",
        payer_account_id: "0.0.1234",
        amount: "1000",
        transfer_type: "transfer",
        consensus_timestamp: "1234567890123456789",
        transaction_hash: "0xhash1",
      };

      mockedNetwork.mockResolvedValueOnce(
        getMockResponse({
          data: {
            erc_token_transfer: [mockTransfer],
          },
        }),
      );

      const result = await hgraphClient.getERC20Transfers({
        currency: mockCurrency,
        address: mockTransfer.payer_account_id,
        tokenEvmAddresses: [mockTransfer.token_evm_address],
        fetchAllPages: true,
      });

      const queryVariables = mockedNetwork.mock.calls[0][0].data.variables;
      expect(mockedNetwork).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockTransfer]);
      expect(queryVariables.accountId).toBe("1234");
      expect(queryVariables.limit).toBe(100);
    });

    it("should keep fetching all pages when fetchAllPages is true", async () => {
      const mockTransfers1 = [
        { consensus_timestamp: "1000000000000000000", transaction_hash: "0xhash1" },
      ];
      const mockTransfers2 = [
        { consensus_timestamp: "2000000000000000000", transaction_hash: "0xhash2" },
      ];
      const mockTransfers3 = [
        { consensus_timestamp: "3000000000000000000", transaction_hash: "0xhash3" },
      ];

      mockedNetwork
        .mockResolvedValueOnce(
          getMockResponse({
            data: { erc_token_transfer: mockTransfers1 },
          }),
        )
        .mockResolvedValueOnce(
          getMockResponse({
            data: { erc_token_transfer: mockTransfers2 },
          }),
        )
        .mockResolvedValueOnce(
          getMockResponse({
            data: { erc_token_transfer: mockTransfers3 },
          }),
        )
        .mockResolvedValueOnce(
          getMockResponse({
            data: { erc_token_transfer: [] },
          }),
        );

      const result = await hgraphClient.getERC20Transfers({
        currency: mockCurrency,
        address: "0.0.1234",
        tokenEvmAddresses: ["0xabc123"],
        limit: 1,
        fetchAllPages: true,
      });

      expect(mockedNetwork).toHaveBeenCalledTimes(4);
      expect(result.map(t => t.consensus_timestamp)).toEqual([
        "1000000000000000000",
        "2000000000000000000",
        "3000000000000000000",
      ]);
    });

    it("should paginate when fetchAllPages is false", async () => {
      const mockTransfers1 = [
        { consensus_timestamp: "1000000000000000000", transaction_hash: "0xhash1" },
        { consensus_timestamp: "1100000000000000000", transaction_hash: "0xhash1a" },
      ];
      const mockTransfers2 = [
        { consensus_timestamp: "2000000000000000000", transaction_hash: "0xhash2" },
        { consensus_timestamp: "2100000000000000000", transaction_hash: "0xhash2a" },
      ];

      mockedNetwork
        .mockResolvedValueOnce(
          getMockResponse({
            data: { erc_token_transfer: mockTransfers1 },
          }),
        )
        .mockResolvedValueOnce(
          getMockResponse({
            data: { erc_token_transfer: mockTransfers2 },
          }),
        );

      const result = await hgraphClient.getERC20Transfers({
        currency: mockCurrency,
        address: "0.0.1234",
        tokenEvmAddresses: ["0xabc123"],
        limit: 2,
        fetchAllPages: false,
      });

      expect(mockedNetwork).toHaveBeenCalledTimes(1);
      expect(result.map(t => t.consensus_timestamp)).toEqual([
        "1000000000000000000",
        "1100000000000000000",
      ]);
    });

    it("should handle timestamp parameter correctly", async () => {
      mockedNetwork.mockResolvedValueOnce(
        getMockResponse({
          data: { erc_token_transfer: [] },
        }),
      );

      await hgraphClient.getERC20Transfers({
        currency: mockCurrency,
        address: "0.0.1234",
        tokenEvmAddresses: ["0xabc123"],
        timestamp: "1234567890.123456789",
        fetchAllPages: true,
      });

      const query = mockedNetwork.mock.calls[0][0].data.query;
      const queryVariables = mockedNetwork.mock.calls[0][0].data.variables;
      expect(query).toContain("consensus_timestamp: { _gt: $cursor }");
      expect(queryVariables.cursor).toBe("1234567890123456789");
    });

    it("should use correct pagination direction for desc order", async () => {
      mockedNetwork.mockResolvedValueOnce(
        getMockResponse({
          data: { erc_token_transfer: [] },
        }),
      );

      await hgraphClient.getERC20Transfers({
        currency: mockCurrency,
        address: "0.0.1234",
        tokenEvmAddresses: ["0xabc123"],
        order: "desc",
        fetchAllPages: false,
      });

      const query = mockedNetwork.mock.calls[0][0].data.query;
      expect(query).toContain("order_by: { consensus_timestamp: desc }");
    });

    it("should throw error when API returns errors", async () => {
      mockedNetwork.mockResolvedValueOnce(
        getMockResponse({
          errors: [{ message: "Query failed" }],
        }),
      );

      await expect(
        hgraphClient.getERC20Transfers({
          currency: mockCurrency,
          address: "0.0.1234",
          tokenEvmAddresses: ["0xabc123"],
          fetchAllPages: true,
        }),
      ).rejects.toThrow();
    });
  });

  describe("getERC20TransfersByTimestampRange", () => {
    it("should fetch transfers within timestamp range", async () => {
      const mockTransfers = [
        {
          token_id: "0.0.5001",
          consensus_timestamp: "1500000000000000000",
          transaction_hash: "0xhash1",
        },
      ];

      mockedNetwork.mockResolvedValueOnce(
        getMockResponse({
          data: { erc_token_transfer: mockTransfers },
        }),
      );

      const result = await hgraphClient.getERC20TransfersByTimestampRange({
        currency: mockCurrency,
        startTimestamp: "1000.000000000",
        endTimestamp: "2000.000000000",
      });

      const queryVariables = mockedNetwork.mock.calls[0][0].data.variables;
      expect(mockedNetwork).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockTransfers);
      expect(queryVariables.startTimestamp).toBe("1000000000000");
      expect(queryVariables.endTimestamp).toBe("2000000000000");
    });

    it("should normalize timestamps by removing dots", async () => {
      mockedNetwork.mockResolvedValueOnce(
        getMockResponse({
          data: { erc_token_transfer: [] },
        }),
      );

      await hgraphClient.getERC20TransfersByTimestampRange({
        currency: mockCurrency,
        startTimestamp: "1234.567890123",
        endTimestamp: "5678.901234567",
      });

      const queryVariables = mockedNetwork.mock.calls[0][0].data.variables;
      expect(queryVariables.startTimestamp).toBe("1234567890123");
      expect(queryVariables.endTimestamp).toBe("5678901234567");
    });

    it("should fetch all pages until no more results", async () => {
      mockedNetwork
        .mockResolvedValueOnce(
          getMockResponse({
            data: {
              erc_token_transfer: [
                { consensus_timestamp: "1100000000000000000", transaction_hash: "0xhash1" },
              ],
            },
          }),
        )
        .mockResolvedValueOnce(
          getMockResponse({
            data: {
              erc_token_transfer: [
                { consensus_timestamp: "1200000000000000000", transaction_hash: "0xhash2" },
              ],
            },
          }),
        )
        .mockResolvedValueOnce(
          getMockResponse({
            data: { erc_token_transfer: [] },
          }),
        );

      const result = await hgraphClient.getERC20TransfersByTimestampRange({
        currency: mockCurrency,
        startTimestamp: "1000.000000000",
        endTimestamp: "2000.000000000",
        limit: 1,
      });

      expect(mockedNetwork).toHaveBeenCalledTimes(3);
      expect(result.map(t => t.consensus_timestamp)).toEqual([
        "1100000000000000000",
        "1200000000000000000",
      ]);
    });

    it("should use cursor for subsequent pages", async () => {
      mockedNetwork
        .mockResolvedValueOnce(
          getMockResponse({
            data: {
              erc_token_transfer: [
                { consensus_timestamp: "1100000000000000000", transaction_hash: "0xhash1" },
              ],
            },
          }),
        )
        .mockResolvedValueOnce(
          getMockResponse({
            data: { erc_token_transfer: [] },
          }),
        );

      await hgraphClient.getERC20TransfersByTimestampRange({
        currency: mockCurrency,
        startTimestamp: "1000.000000000",
        endTimestamp: "2000.000000000",
        limit: 1,
      });

      const firstCall = mockedNetwork.mock.calls[0][0];
      const secondCall = mockedNetwork.mock.calls[1][0];

      // First call should use _gte with startTimestamp
      expect(firstCall.data.query).toContain("_gte: $startTimestamp");
      expect(firstCall.data.variables).not.toHaveProperty("cursor");
      // Second call should use _gt with cursor
      expect(secondCall.data.query).toContain("_gt: $cursor");
      expect(secondCall.data.variables.cursor).toBe("1100000000000000000");
    });

    it("should support custom order parameter", async () => {
      mockedNetwork.mockResolvedValueOnce(
        getMockResponse({
          data: { erc_token_transfer: [] },
        }),
      );

      await hgraphClient.getERC20TransfersByTimestampRange({
        currency: mockCurrency,
        startTimestamp: "1000.000000000",
        endTimestamp: "2000.000000000",
        order: "asc",
      });

      const query = mockedNetwork.mock.calls[0][0].data.query;
      expect(query).toContain("order_by: { consensus_timestamp: asc }");
    });

    it("should throw error when API returns errors", async () => {
      mockedNetwork.mockResolvedValueOnce(
        getMockResponse({
          errors: [{ message: "Invalid timestamp range" }],
        }),
      );

      await expect(
        hgraphClient.getERC20TransfersByTimestampRange({
          currency: mockCurrency,
          startTimestamp: "1000.000000000",
          endTimestamp: "2000.000000000",
        }),
      ).rejects.toThrow();
    });
  });
});
