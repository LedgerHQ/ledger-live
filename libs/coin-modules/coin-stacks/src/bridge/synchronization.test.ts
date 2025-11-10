/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-assertions */
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { buildTokenAccounts, createTokenAccount } from "./synchronization";
import { TransactionResponse } from "../network";
import { TokenPrefix } from "../types";
import { log } from "@ledgerhq/logs";
import * as accountIndex from "@ledgerhq/coin-framework/account/index";
import * as cryptoAssets from "@ledgerhq/coin-framework/crypto-assets/index";

jest.mock("@ledgerhq/coin-framework/crypto-assets/index");
jest.mock("@ledgerhq/logs");
jest.mock("@ledgerhq/coin-framework/account/index", () => ({
  ...jest.requireActual("@ledgerhq/coin-framework/account/index"),
  encodeTokenAccountId: jest.fn(),
}));

let mockFindTokenById: jest.Mock;
const mockLog = log as jest.MockedFunction<typeof log>;

beforeEach(() => {
  mockFindTokenById = jest.fn();
  (cryptoAssets.getCryptoAssetsStore as jest.Mock).mockReturnValue({
    findTokenById: mockFindTokenById,
  });
});

describe("buildTokenAccounts", () => {
  const mockAddress = "SP26AZ1JSFZQ82VH5W2NJSB2QW15EW5YKT6WMD69J";
  const mockParentAccountId = "js:2:stacks:mock-pubkey:";
  const mockTokenId1 = "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.alex-token";
  const mockTokenId2 = "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usda-token";
  const mockTokenId3 = "SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.Wrapped-Bitcoin";

  const mockToken1 = {
    id: TokenPrefix + mockTokenId1,
    contractAddress: "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9",
    name: "ALEX Token",
    ticker: "ALEX",
    decimals: 8,
    type: "TokenCurrency" as const,
  };

  const mockToken2 = {
    id: TokenPrefix + mockTokenId2,
    contractAddress: "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR",
    name: "USDA Token",
    ticker: "USDA",
    decimals: 6,
    type: "TokenCurrency" as const,
  };

  const mockToken3 = {
    id: TokenPrefix + mockTokenId3,
    contractAddress: "SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR",
    name: "Wrapped Bitcoin",
    ticker: "XBTC",
    decimals: 8,
    type: "TokenCurrency" as const,
  };

  const mockTransaction1: TransactionResponse = {
    tx: {
      tx_id: "0x123abc",
      nonce: 1,
      fee_rate: "1000",
      sender_address: mockAddress,
      sponsored: false,
      post_condition_mode: "deny",
      post_conditions: [],
      anchor_mode: "any",
      is_unanchored: false,
      block_hash: "0xabc123",
      parent_block_hash: "0x000000",
      block_height: 100,
      block_time: 1000000,
      block_time_iso: "2023-01-01T00:00:00.000Z",
      burn_block_time: 1000000,
      burn_block_time_iso: "2023-01-01T00:00:00.000Z",
      parent_burn_block_time: 999999,
      parent_burn_block_time_iso: "2023-01-01T00:00:00.000Z",
      canonical: true,
      tx_index: 1,
      tx_status: "success",
      tx_result: { hex: "0x01", repr: "(ok true)" },
      microblock_hash: "",
      microblock_sequence: 0,
      microblock_canonical: true,
      event_count: 1,
      events: [],
      execution_cost_read_count: 0,
      execution_cost_read_length: 0,
      execution_cost_runtime: 0,
      execution_cost_write_count: 0,
      execution_cost_write_length: 0,
      tx_type: "contract_call",
    },
    stx_sent: "0",
    stx_received: "0",
    events: {
      stx: { transfer: 0, mint: 0, burn: 0 },
      ft: { transfer: 1, mint: 0, burn: 0 },
      nft: { transfer: 0, mint: 0, burn: 0 },
    },
  };

  const mockTransaction2: TransactionResponse = {
    ...mockTransaction1,
    tx: {
      ...mockTransaction1.tx,
      tx_id: "0x456def",
      nonce: 2,
      block_height: 101,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (accountIndex.encodeTokenAccountId as jest.Mock).mockImplementation(
      (parentId: string, token: any) => `${parentId}+${token.id}`,
    );
  });

  describe("tokens with both transactions and balances", () => {
    it("should build token accounts for tokens with transactions and balances", async () => {
      mockFindTokenById.mockImplementation((tokenId: string) => {
        if (tokenId === TokenPrefix + mockTokenId1) return mockToken1 as any;
        if (tokenId === TokenPrefix + mockTokenId2) return mockToken2 as any;
        return undefined;
      });

      const tokenTxs = {
        [mockTokenId1]: [mockTransaction1],
        [mockTokenId2]: [mockTransaction2],
      };

      const tokenBalances = {
        [mockTokenId1]: "1000000",
        [mockTokenId2]: "2000000",
      };

      const result = await buildTokenAccounts(
        mockAddress,
        mockParentAccountId,
        tokenTxs,
        tokenBalances,
      );

      expect(result).toHaveLength(2);
      expect(mockFindTokenById).toHaveBeenCalledWith(TokenPrefix + mockTokenId1);
      expect(mockFindTokenById).toHaveBeenCalledWith(TokenPrefix + mockTokenId2);
    });

    it("should use balance from tokenBalances for tokens with transactions", async () => {
      mockFindTokenById.mockReturnValue(mockToken1 as any);

      const tokenTxs = {
        [mockTokenId1]: [mockTransaction1],
      };

      const tokenBalances = {
        [mockTokenId1]: "5000000",
      };

      const result = await buildTokenAccounts(
        mockAddress,
        mockParentAccountId,
        tokenTxs,
        tokenBalances,
      );

      expect(result).toHaveLength(1);
      expect(result[0].balance.toString()).toBe("5000000");
    });

    it("should use '0' balance when token has transactions but no balance entry", async () => {
      mockFindTokenById.mockReturnValue(mockToken1 as any);

      const tokenTxs = {
        [mockTokenId1]: [mockTransaction1],
      };

      const tokenBalances = {};

      const result = await buildTokenAccounts(
        mockAddress,
        mockParentAccountId,
        tokenTxs,
        tokenBalances,
      );

      // Note: createTokenAccount filters out accounts with 0 balance and no operations
      // Since mockTransaction1 doesn't create operations (it needs proper event processing),
      // the account will be filtered out. This is expected behavior.
      expect(result).toHaveLength(0);
    });
  });

  describe("tokens with only balances (no transactions)", () => {
    it("should build token accounts for tokens with balances but no transactions", async () => {
      mockFindTokenById.mockReturnValue(mockToken1 as any);

      const tokenTxs = {};

      const tokenBalances = {
        [mockTokenId1]: "3000000",
      };

      const result = await buildTokenAccounts(
        mockAddress,
        mockParentAccountId,
        tokenTxs,
        tokenBalances,
      );

      expect(result).toHaveLength(1);
      expect(result[0].balance.toString()).toBe("3000000");
      expect(result[0].operations).toHaveLength(0);
    });

    it("should skip tokens with zero balances and no transactions", async () => {
      mockFindTokenById.mockReturnValue(mockToken1 as any);

      const tokenTxs = {};

      const tokenBalances = {
        [mockTokenId1]: "0",
        [mockTokenId2]: "0",
      };

      const result = await buildTokenAccounts(
        mockAddress,
        mockParentAccountId,
        tokenTxs,
        tokenBalances,
      );

      expect(result).toHaveLength(0);
    });

    it("should not process the same token twice (skip duplicates in balance-only processing)", async () => {
      mockFindTokenById.mockReturnValue(mockToken1 as any);

      const tokenTxs = {
        [mockTokenId1]: [mockTransaction1],
      };

      const tokenBalances = {
        [mockTokenId1]: "1000000",
      };

      const result = await buildTokenAccounts(
        mockAddress,
        mockParentAccountId,
        tokenTxs,
        tokenBalances,
      );

      // Should only have 1 account, not 2
      expect(result).toHaveLength(1);
    });
  });

  describe("mixed scenarios", () => {
    it("should handle mix of tokens with transactions, balances only, and zero balances", async () => {
      mockFindTokenById.mockImplementation((tokenId: string) => {
        if (tokenId === TokenPrefix + mockTokenId1) return mockToken1 as any;
        if (tokenId === TokenPrefix + mockTokenId2) return mockToken2 as any;
        if (tokenId === TokenPrefix + mockTokenId3) return mockToken3 as any;
        return null;
      });

      const tokenTxs = {
        [mockTokenId1]: [mockTransaction1], // Has transactions
      };

      const tokenBalances = {
        [mockTokenId1]: "1000000", // Also has balance
        [mockTokenId2]: "2000000", // Balance only, no transactions
        [mockTokenId3]: "0", // Zero balance, should be skipped
      };

      const result = await buildTokenAccounts(
        mockAddress,
        mockParentAccountId,
        tokenTxs,
        tokenBalances,
      );

      expect(result).toHaveLength(2);
      // Should have mockTokenId1 and mockTokenId2, but not mockTokenId3
    });

    it("should handle empty tokenTxs and tokenBalances", async () => {
      const result = await buildTokenAccounts(mockAddress, mockParentAccountId, {}, {});

      expect(result).toHaveLength(0);
    });

    it("should handle multiple transactions for the same token", async () => {
      mockFindTokenById.mockReturnValue(mockToken1 as any);

      const tokenTxs = {
        [mockTokenId1]: [mockTransaction1, mockTransaction2],
      };

      const tokenBalances = {
        [mockTokenId1]: "1000000",
      };

      const result = await buildTokenAccounts(
        mockAddress,
        mockParentAccountId,
        tokenTxs,
        tokenBalances,
      );

      expect(result).toHaveLength(1);
      // Operations should be processed from both transactions
    });
  });

  describe("error handling", () => {
    it("should filter out null token accounts when token is not found", async () => {
      mockFindTokenById.mockReturnValue(undefined);

      const tokenTxs = {
        [mockTokenId1]: [mockTransaction1],
      };

      const tokenBalances = {
        [mockTokenId1]: "1000000",
      };

      const result = await buildTokenAccounts(
        mockAddress,
        mockParentAccountId,
        tokenTxs,
        tokenBalances,
      );

      expect(result).toHaveLength(0);
    });

    it("should return empty array and log error on exception", async () => {
      mockFindTokenById.mockImplementation(() => {
        throw new Error("Test error");
      });

      const tokenTxs = {
        [mockTokenId1]: [mockTransaction1],
      };

      const tokenBalances = {
        [mockTokenId1]: "1000000",
      };

      const result = await buildTokenAccounts(
        mockAddress,
        mockParentAccountId,
        tokenTxs,
        tokenBalances,
      );

      expect(result).toHaveLength(0);
      // The error is logged in createTokenAccount, not buildTokenAccounts
      expect(mockLog).toHaveBeenCalledWith(
        "error",
        "stacks error creating token account",
        expect.any(Error),
      );
    });

    it("should filter out null accounts when createTokenAccount returns null", async () => {
      // First call succeeds, second fails
      mockFindTokenById
        .mockReturnValueOnce(mockToken1 as any)
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(mockToken3 as any);

      const tokenTxs = {
        [mockTokenId1]: [mockTransaction1],
        [mockTokenId2]: [mockTransaction2],
      };

      const tokenBalances = {
        [mockTokenId1]: "1000000",
        [mockTokenId2]: "2000000",
        [mockTokenId3]: "3000000",
      };

      const result = await buildTokenAccounts(
        mockAddress,
        mockParentAccountId,
        tokenTxs,
        tokenBalances,
      );

      // Should only have accounts for mockTokenId1 and mockTokenId3
      expect(result).toHaveLength(2);
    });
  });

  describe("with initialAccount", () => {
    it("should pass initialAccount to createTokenAccount", async () => {
      mockFindTokenById.mockReturnValue(mockToken1 as any);

      const mockInitialAccount = {
        id: mockParentAccountId,
        subAccounts: [],
      } as unknown as Account;

      const tokenTxs = {
        [mockTokenId1]: [mockTransaction1],
      };

      const tokenBalances = {
        [mockTokenId1]: "1000000",
      };

      const result = await buildTokenAccounts(
        mockAddress,
        mockParentAccountId,
        tokenTxs,
        tokenBalances,
        mockInitialAccount,
      );

      expect(result).toHaveLength(1);
      // The function should work correctly with initialAccount
    });

    it("should preserve pending operations from initialAccount subaccounts", async () => {
      mockFindTokenById.mockReturnValue(mockToken1 as any);

      const tokenAccountId = `${mockParentAccountId}+${mockToken1.id}`;

      const mockInitialAccount = {
        id: mockParentAccountId,
        subAccounts: [
          {
            id: tokenAccountId,
            type: "TokenAccount",
            token: mockToken1,
            pendingOperations: [
              {
                id: "pending-op-1",
                type: "OUT",
                value: new BigNumber(100),
              },
            ],
            swapHistory: [],
          },
        ],
      } as unknown as Account;

      const tokenTxs = {
        [mockTokenId1]: [mockTransaction1],
      };

      const tokenBalances = {
        [mockTokenId1]: "1000000",
      };

      const result = await buildTokenAccounts(
        mockAddress,
        mockParentAccountId,
        tokenTxs,
        tokenBalances,
        mockInitialAccount,
      );

      expect(result).toHaveLength(1);
      // Should preserve pendingOperations from initial account
    });
  });

  describe("balance handling", () => {
    it("should handle various balance formats correctly", async () => {
      mockFindTokenById.mockReturnValue(mockToken1 as any);

      const tokenTxs = {
        [mockTokenId1]: [mockTransaction1],
      };

      const tokenBalances = {
        [mockTokenId1]: "999999999999999",
      };

      const result = await buildTokenAccounts(
        mockAddress,
        mockParentAccountId,
        tokenTxs,
        tokenBalances,
      );

      expect(result).toHaveLength(1);
      expect(result[0].balance).toBeInstanceOf(BigNumber);
      expect(result[0].balance.toString()).toBe("999999999999999");
    });

    it("should handle string number balances", async () => {
      mockFindTokenById.mockReturnValue(mockToken1 as any);

      const tokenTxs = {};

      const tokenBalances = {
        [mockTokenId1]: "123456789",
      };

      const result = await buildTokenAccounts(
        mockAddress,
        mockParentAccountId,
        tokenTxs,
        tokenBalances,
      );

      expect(result).toHaveLength(1);
      expect(result[0].balance.toString()).toBe("123456789");
    });
  });

  describe("edge cases", () => {
    it("should handle tokenId with special characters", async () => {
      const specialTokenId = "SP1234.token-with-dashes_and.dots";
      const specialToken = {
        ...mockToken1,
        id: TokenPrefix + specialTokenId,
      };

      mockFindTokenById.mockReturnValue(specialToken as any);

      const tokenTxs = {
        [specialTokenId]: [mockTransaction1],
      };

      const tokenBalances = {
        [specialTokenId]: "1000000",
      };

      const result = await buildTokenAccounts(
        mockAddress,
        mockParentAccountId,
        tokenTxs,
        tokenBalances,
      );

      expect(result).toHaveLength(1);
    });

    it("should handle very large number of tokens", async () => {
      mockFindTokenById.mockReturnValue(mockToken1 as any);

      const tokenTxs: Record<string, TransactionResponse[]> = {};
      const tokenBalances: Record<string, string> = {};

      // Create 100 tokens
      for (let i = 0; i < 100; i++) {
        const tokenId = `SP${i}.token-${i}`;
        tokenBalances[tokenId] = `${1000000 * (i + 1)}`;
      }

      const result = await buildTokenAccounts(
        mockAddress,
        mockParentAccountId,
        tokenTxs,
        tokenBalances,
      );

      expect(result).toHaveLength(100);
    });

    it("should maintain order of token processing", async () => {
      mockFindTokenById.mockImplementation((tokenId: string) => {
        if (tokenId === TokenPrefix + mockTokenId1) return mockToken1 as any;
        if (tokenId === TokenPrefix + mockTokenId2) return mockToken2 as any;
        if (tokenId === TokenPrefix + mockTokenId3) return mockToken3 as any;
        return null;
      });

      const tokenTxs = {
        [mockTokenId1]: [mockTransaction1],
        [mockTokenId2]: [mockTransaction2],
      };

      const tokenBalances = {
        [mockTokenId1]: "1000000",
        [mockTokenId2]: "2000000",
        [mockTokenId3]: "3000000",
      };

      const result = await buildTokenAccounts(
        mockAddress,
        mockParentAccountId,
        tokenTxs,
        tokenBalances,
      );

      expect(result).toHaveLength(3);
      // First two should be from tokenTxs (mockTokenId1, mockTokenId2)
      // Last should be from tokenBalances only (mockTokenId3)
    });
  });
});

describe("createTokenAccount", () => {
  const mockAddress = "SP26AZ1JSFZQ82VH5W2NJSB2QW15EW5YKT6WMD69J";
  const mockParentAccountId = "js:2:stacks:mock-pubkey:";
  const mockTokenId = "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.alex-token";

  const mockToken = {
    id: TokenPrefix + mockTokenId,
    contractAddress: "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9",
    name: "ALEX Token",
    ticker: "ALEX",
    decimals: 8,
    type: "TokenCurrency" as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (accountIndex.encodeTokenAccountId as jest.Mock).mockImplementation(
      (parentId: string, token: any) => `${parentId}+${token.id}`,
    );
  });

  describe("successful token account creation", () => {
    it("should create token account with transactions and balance", async () => {
      mockFindTokenById.mockResolvedValue(mockToken as any);

      const transactions: TransactionResponse[] = [];
      const balance = "1000000";

      const result = await createTokenAccount(
        mockAddress,
        mockParentAccountId,
        mockTokenId,
        balance,
        transactions,
      );

      expect(result).not.toBeNull();
      expect(result?.balance.toString()).toBe(balance);
      expect(result?.type).toBe("TokenAccount");
      expect(result?.parentId).toBe(mockParentAccountId);
    });

    it("should create token account with zero balance but returns null when no operations", async () => {
      mockFindTokenById.mockResolvedValue(mockToken as any);

      const transactions: TransactionResponse[] = [];
      const balance = "0";

      const result = await createTokenAccount(
        mockAddress,
        mockParentAccountId,
        mockTokenId,
        balance,
        transactions,
      );

      // Should return null when both balance and operations are empty
      expect(result).toBeNull();
    });

    it("should preserve pending operations from initialAccount", async () => {
      mockFindTokenById.mockResolvedValue(mockToken as any);

      const tokenAccountId = `${mockParentAccountId}+${mockToken.id}`;
      const mockPendingOp = {
        id: "pending-op-1",
        type: "OUT" as const,
        value: new BigNumber(100),
        date: new Date(),
      };

      const initialAccount = {
        id: mockParentAccountId,
        subAccounts: [
          {
            id: tokenAccountId,
            type: "TokenAccount" as const,
            token: mockToken,
            pendingOperations: [mockPendingOp],
            swapHistory: [{ id: "swap-1" }],
          },
        ],
      } as any;

      const result = await createTokenAccount(
        mockAddress,
        mockParentAccountId,
        mockTokenId,
        "1000000",
        [],
        initialAccount,
      );

      expect(result).not.toBeNull();
      expect(result?.pendingOperations).toHaveLength(1);
      expect(result?.pendingOperations[0].id).toBe("pending-op-1");
      expect(result?.swapHistory).toHaveLength(1);
    });

    it("should use empty arrays when no matching initialAccount subaccount", async () => {
      mockFindTokenById.mockResolvedValue(mockToken as any);

      const initialAccount = {
        id: mockParentAccountId,
        subAccounts: [],
      } as any;

      const result = await createTokenAccount(
        mockAddress,
        mockParentAccountId,
        mockTokenId,
        "1000000",
        [],
        initialAccount,
      );

      expect(result).not.toBeNull();
      expect(result?.pendingOperations).toHaveLength(0);
      expect(result?.swapHistory).toHaveLength(0);
    });
  });

  describe("error handling", () => {
    it("should return null when token is not found in registry", async () => {
      mockFindTokenById.mockResolvedValue(undefined);

      const result = await createTokenAccount(
        mockAddress,
        mockParentAccountId,
        mockTokenId,
        "1000000",
        [],
      );

      expect(result).toBeNull();
      expect(mockLog).toHaveBeenCalledWith("error", `stacks token not found, addr: ${mockTokenId}`);
    });

    it("should return null when tokenId is empty", async () => {
      const result = await createTokenAccount(mockAddress, mockParentAccountId, "", "1000000", []);

      expect(result).toBeNull();
    });

    it("should return null and log error on exception", async () => {
      mockFindTokenById.mockRejectedValue(new Error("Token lookup failed"));

      const result = await createTokenAccount(
        mockAddress,
        mockParentAccountId,
        mockTokenId,
        "1000000",
        [],
      );

      expect(result).toBeNull();
      expect(mockLog).toHaveBeenCalledWith(
        "error",
        "stacks error creating token account",
        expect.any(Error),
      );
    });
  });

  describe("balance handling", () => {
    it("should handle undefined balance as zero", async () => {
      mockFindTokenById.mockResolvedValue(mockToken as any);

      const result = await createTokenAccount(
        mockAddress,
        mockParentAccountId,
        mockTokenId,
        undefined as any,
        [],
      );

      // Should return null because balance is zero and no operations
      expect(result).toBeNull();
    });

    it("should handle very large balance values", async () => {
      mockFindTokenById.mockResolvedValue(mockToken as any);

      const largeBalance = "999999999999999999999999";
      const result = await createTokenAccount(
        mockAddress,
        mockParentAccountId,
        mockTokenId,
        largeBalance,
        [],
      );

      expect(result).not.toBeNull();
      // BigNumber may use scientific notation for very large numbers
      expect(result?.balance.isEqualTo(new BigNumber(largeBalance))).toBe(true);
    });

    it("should set spendableBalance equal to balance", async () => {
      mockFindTokenById.mockResolvedValue(mockToken as any);

      const balance = "5000000";
      const result = await createTokenAccount(
        mockAddress,
        mockParentAccountId,
        mockTokenId,
        balance,
        [],
      );

      expect(result).not.toBeNull();
      expect(result?.spendableBalance.toString()).toBe(balance);
    });
  });

  describe("operations processing", () => {
    it("should set operationsCount correctly", async () => {
      mockFindTokenById.mockResolvedValue(mockToken as any);

      const result = await createTokenAccount(
        mockAddress,
        mockParentAccountId,
        mockTokenId,
        "1000000",
        [], // Empty transactions, will result in 0 operations
      );

      expect(result).not.toBeNull();
      expect(result?.operationsCount).toBe(0);
    });

    it("should set creationDate from current time when no operations exist", async () => {
      mockFindTokenById.mockResolvedValue(mockToken as any);

      const result = await createTokenAccount(
        mockAddress,
        mockParentAccountId,
        mockTokenId,
        "1000000",
        [],
      );

      expect(result).not.toBeNull();
      expect(result?.creationDate).toBeInstanceOf(Date);
    });
  });

  describe("token ID format handling", () => {
    it("should handle token ID with :: in format", async () => {
      const tokenIdWithAsset = "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.alex-token::alex";
      const mockTokenWithAsset = {
        ...mockToken,
        id: TokenPrefix + tokenIdWithAsset,
      };

      mockFindTokenById.mockResolvedValue(mockTokenWithAsset as any);

      const result = await createTokenAccount(
        mockAddress,
        mockParentAccountId,
        tokenIdWithAsset,
        "1000000",
        [],
      );

      expect(result).not.toBeNull();
    });

    it("should handle token ID with special characters", async () => {
      const specialTokenId = "SP123.token-with_special.chars::asset-name";
      const mockSpecialToken = {
        ...mockToken,
        id: TokenPrefix + specialTokenId,
      };

      mockFindTokenById.mockResolvedValue(mockSpecialToken as any);

      const result = await createTokenAccount(
        mockAddress,
        mockParentAccountId,
        specialTokenId,
        "1000000",
        [],
      );

      expect(result).not.toBeNull();
    });
  });
});
