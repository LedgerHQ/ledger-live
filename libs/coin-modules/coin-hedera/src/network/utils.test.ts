import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import BigNumber from "bignumber.js";
import { SUPPORTED_ERC20_TOKENS } from "../constants";
import { getMockedAccount } from "../test/fixtures/account.fixture";
import { getMockedERC20TokenCurrency } from "../test/fixtures/currency.fixture";
import {
  getMockedERC20TokenBalance,
  getMockedERC20TokenTransfer,
} from "../test/fixtures/hgraph.fixture";
import {
  createMirrorCoinTransfer,
  createMirrorTokenTransfer,
  getMockedMirrorTransaction,
  getMockedMirrorContractCallResult,
} from "../test/fixtures/mirror.fixture";
import { getMockedThirdwebTransaction } from "../test/fixtures/thirdweb.fixture";
import type { HederaMirrorCoinTransfer } from "../types";
import { apiClient } from "./api";
import { hgraphClient } from "./hgraph";
import {
  enrichERC20Transfers,
  getERC20BalancesForAccount,
  getERC20BalancesForAccountV2,
  getERC20Operations,
  parseThirdwebTransactionParams,
  parseTransfers,
} from "./utils";

jest.mock("./api");
jest.mock("./hgraph");

describe("network utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("parseTransfers", () => {
    it("should correctly identify an incoming transfer", () => {
      const userAddress = "0.0.1234";
      const transfers = [
        createMirrorCoinTransfer("0.0.5678", -100),
        createMirrorCoinTransfer(userAddress, 100),
      ];

      const result = parseTransfers(transfers, userAddress);

      expect(result.type).toBe("IN");
      expect(result.value).toEqual(new BigNumber(100));
      expect(result.senders).toEqual(["0.0.5678"]);
      expect(result.recipients).toEqual([userAddress]);
    });

    it("should correctly identify an outgoing transfer", () => {
      const userAddress = "0.0.1234";
      const transfers = [
        createMirrorCoinTransfer(userAddress, -100),
        createMirrorCoinTransfer("0.0.5678", 100),
      ];

      const result = parseTransfers(transfers, userAddress);

      expect(result.type).toBe("OUT");
      expect(result.value).toEqual(new BigNumber(100));
      expect(result.senders).toEqual([userAddress]);
      expect(result.recipients).toEqual(["0.0.5678"]);
    });

    it("should handle multiple senders and recipients", () => {
      const userAddress = "0.0.1234";
      const transfers = [
        createMirrorCoinTransfer("0.0.5678", -50),
        createMirrorCoinTransfer(userAddress, -50),
        createMirrorCoinTransfer("0.0.9999", 100),
      ];

      const result = parseTransfers(transfers, userAddress);

      expect(result.type).toBe("OUT");
      expect(result.value).toEqual(new BigNumber(50));
      expect(result.senders).toEqual(["0.0.1234", "0.0.5678"]);
      expect(result.recipients).toEqual(["0.0.9999"]);
    });

    it("should correctly process token transfers", () => {
      const userAddress = "0.0.1234";
      const tokenId = "0.0.7777";
      const transfers = [
        createMirrorTokenTransfer(userAddress, -10, tokenId),
        createMirrorTokenTransfer("0.0.5678", 10, tokenId),
      ];

      const result = parseTransfers(transfers, userAddress);

      expect(result.type).toBe("OUT");
      expect(result.value).toEqual(new BigNumber(10));
      expect(result.senders).toEqual([userAddress]);
      expect(result.recipients).toEqual(["0.0.5678"]);
    });

    it("should exclude system accounts that are not nodes from recipients", () => {
      const userAddress = "0.0.1234";
      const systemAccount = "0.0.500";
      const transfers = [
        createMirrorCoinTransfer(userAddress, -100),
        createMirrorCoinTransfer(systemAccount, 100),
      ];

      const result = parseTransfers(transfers, userAddress);

      expect(result.type).toBe("OUT");
      expect(result.value).toEqual(new BigNumber(100));
      expect(result.senders).toEqual([userAddress]);
      expect(result.recipients).toEqual([]);
    });

    it("should include node accounts as recipients only if no other recipients", () => {
      const userAddress = "0.0.1234";
      const nodeAccount = "0.0.3";
      const transfers = [
        createMirrorCoinTransfer(userAddress, -100),
        createMirrorCoinTransfer(nodeAccount, 100),
      ];

      const result = parseTransfers(transfers, userAddress);

      expect(result.type).toBe("OUT");
      expect(result.value).toEqual(new BigNumber(100));
      expect(result.senders).toEqual([userAddress]);
      expect(result.recipients).toEqual([nodeAccount]);
    });

    it("should exclude node accounts if there are other recipients", () => {
      const userAddress = "0.0.1234";
      const normalAccount = "0.0.5678";
      const nodeAccount = "0.0.3";
      const transfers = [
        createMirrorCoinTransfer(userAddress, -100),
        createMirrorCoinTransfer(normalAccount, 50),
        createMirrorCoinTransfer(nodeAccount, 50),
      ];

      const result = parseTransfers(transfers, userAddress);

      expect(result.type).toBe("OUT");
      expect(result.value).toEqual(new BigNumber(100));
      expect(result.senders).toEqual([userAddress]);
      expect(result.recipients).toEqual([normalAccount]);
    });

    it("should handle transactions where user is not involved", () => {
      const userAddress = "0.0.1234";
      const transfers = [
        createMirrorCoinTransfer("0.0.5678", -100),
        createMirrorCoinTransfer("0.0.9999", 100),
      ];

      const result = parseTransfers(transfers, userAddress);

      expect(result.type).toBe("NONE");
      expect(result.value).toEqual(new BigNumber(0));
      expect(result.senders).toEqual(["0.0.5678"]);
      expect(result.recipients).toEqual(["0.0.9999"]);
    });

    it("should handle empty transfers array", () => {
      const userAddress = "0.0.1234";
      const transfers: HederaMirrorCoinTransfer[] = [];

      const result = parseTransfers(transfers, userAddress);

      expect(result.type).toBe("NONE");
      expect(result.value).toEqual(new BigNumber(0));
      expect(result.senders).toEqual([]);
      expect(result.recipients).toEqual([]);
    });

    it("should reverse the order of senders and recipients", () => {
      const userAddress = "0.0.1234";
      const transfers = [
        createMirrorCoinTransfer("0.0.900", -5),
        createMirrorCoinTransfer("0.0.5678", -95),
        createMirrorCoinTransfer(userAddress, 100),
      ];

      const result = parseTransfers(transfers, userAddress);

      expect(result.type).toBe("IN");
      expect(result.value).toEqual(new BigNumber(100));
      expect(result.senders).toEqual(["0.0.5678", "0.0.900"]);
      expect(result.recipients).toEqual([userAddress]);
    });
  });

  describe("getERC20BalancesForAccount", () => {
    it("returns balances only for supported ERC20 tokens and calls apiClient.getERC20Balance accordingly", async () => {
      const mockAccount = getMockedAccount();
      const mockedSupportedTokenIds = ["0/erc20/0x0", "0/erc20/0x1", "0/erc20/0x2"];
      const erc20Token = getMockedERC20TokenCurrency();

      const mockedResponse = Array.from({ length: mockedSupportedTokenIds.length }, () => ({
        token: erc20Token,
        balance: new BigNumber(123),
      }));

      (apiClient.getERC20Balance as jest.Mock).mockResolvedValue(new BigNumber(123));
      setupMockCryptoAssetsStore({
        findTokenById: jest.fn().mockReturnValue(erc20Token),
      });

      const res = await getERC20BalancesForAccount(
        mockAccount.freshAddress,
        mockedSupportedTokenIds,
      );

      expect(apiClient.getERC20Balance).toHaveBeenCalledTimes(mockedSupportedTokenIds.length);
      expect(apiClient.getERC20Balance).toHaveBeenCalledWith(
        mockAccount.freshAddress,
        erc20Token.contractAddress,
      );

      expect(res).toEqual(mockedResponse);
    });

    it("returns empty array when there are no supported ERC20 tokens", async () => {
      const supportedTokenIds: string[] = [];
      const res = await getERC20BalancesForAccount("0xaccount", supportedTokenIds);

      expect(res).toEqual([]);
      expect(apiClient.getERC20Balance).not.toHaveBeenCalled();
    });
  });

  describe("getERC20BalancesForAccountV2", () => {
    it("returns balances only for supported ERC20 tokens and calls hgraphClient.getERC20Balances accordingly", async () => {
      const mockAccount = getMockedAccount();
      const erc20Token = getMockedERC20TokenCurrency();

      (hgraphClient.getERC20Balances as jest.Mock).mockResolvedValue([
        getMockedERC20TokenBalance({ token_id: 0, balance: 100 }),
        getMockedERC20TokenBalance({ token_id: 2, balance: 200 }),
        // token id from SUPPORTED_ERC20_TOKENS
        getMockedERC20TokenBalance({ token_id: 9470869, balance: 300 }),
      ]);
      setupMockCryptoAssetsStore({
        findTokenById: jest.fn().mockReturnValue(erc20Token),
      });

      const res = await getERC20BalancesForAccountV2(mockAccount.freshAddress);

      expect(hgraphClient.getERC20Balances).toHaveBeenCalledTimes(1);
      expect(hgraphClient.getERC20Balances).toHaveBeenCalledWith({
        address: mockAccount.freshAddress,
      });
      expect(res).toEqual([
        {
          balance: new BigNumber(300),
          token: expect.objectContaining({
            contractAddress: erc20Token.contractAddress,
          }),
        },
      ]);
    });
  });

  describe("getERC20Operations", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should fetch and combine data from thirdweb and mirror node", async () => {
      const mockTokenERC20 = getMockedERC20TokenCurrency();
      const mockThirdwebTransaction = getMockedThirdwebTransaction({
        transactionHash: "0xTXHASH1",
        address: mockTokenERC20.contractAddress,
        decoded: {
          name: "Transfer",
          signature: "Transfer(address,address,uint256)",
          params: {
            from: "0x1234",
            to: "0x5678",
            value: "1000000",
          },
        },
      });
      const mockContractCallResult = {
        timestamp: "1234567890.000000000",
        contract_id: mockTokenERC20.contractAddress,
        gas_consumed: 50000,
        gas_limit: 100000,
        gas_used: 50000,
      };
      const mockMirrorTransaction = {
        consensus_timestamp: mockContractCallResult.timestamp,
        transaction_hash: "BASE64HASH",
        transaction_id: "0.0.123@1234567890.000",
        charged_tx_fee: 100000,
        memo_base64: "",
      };

      (apiClient.getContractCallResult as jest.Mock).mockResolvedValue(mockContractCallResult);
      (apiClient.findTransactionByContractCall as jest.Mock).mockResolvedValue(
        mockMirrorTransaction,
      );
      setupMockCryptoAssetsStore({
        findTokenByAddressInCurrency: jest.fn().mockReturnValue(mockTokenERC20),
      });

      const result = await getERC20Operations([mockThirdwebTransaction]);

      expect(result).toEqual([
        {
          thirdwebTransaction: mockThirdwebTransaction,
          mirrorTransaction: mockMirrorTransaction,
          contractCallResult: mockContractCallResult,
          token: mockTokenERC20,
        },
      ]);
      expect(apiClient.getContractCallResult).toHaveBeenCalledTimes(1);
      expect(apiClient.getContractCallResult).toHaveBeenCalledWith(
        mockThirdwebTransaction.transactionHash,
      );
      expect(apiClient.findTransactionByContractCall).toHaveBeenCalledTimes(1);
      expect(apiClient.findTransactionByContractCall).toHaveBeenCalledWith(
        mockContractCallResult.timestamp,
        mockTokenERC20.contractAddress,
      );
    });

    it("should skip transactions for tokens not found in currency list", async () => {
      const mockThirdwebTransactions = [
        getMockedThirdwebTransaction({
          transactionHash: "0xTXHASH1",
          address: "unknown",
        }),
      ];

      setupMockCryptoAssetsStore({
        findTokenByAddressInCurrency: jest.fn().mockReturnValue(undefined),
      });

      const result = await getERC20Operations(mockThirdwebTransactions);

      expect(result).toEqual([]);
      expect(apiClient.getContractCallResult).not.toHaveBeenCalled();
      expect(apiClient.findTransactionByContractCall).not.toHaveBeenCalled();
    });

    it("should skip transactions when mirror transaction is not found", async () => {
      const mockTokenERC20 = getMockedERC20TokenCurrency();
      const mockThirdwebTransactions = getMockedThirdwebTransaction({
        transactionHash: "0xTXHASH1",
        address: mockTokenERC20.contractAddress,
      });
      const mockContractCallResult = {
        timestamp: "1234567890.000000000",
        contract_id: mockTokenERC20.contractAddress,
        gas_consumed: 50000,
        gas_limit: 100000,
        gas_used: 50000,
      };

      (apiClient.getContractCallResult as jest.Mock).mockResolvedValue(
        mockContractCallResult as any,
      );
      (apiClient.findTransactionByContractCall as jest.Mock).mockResolvedValue(null);
      setupMockCryptoAssetsStore({
        findTokenByAddressInCurrency: jest.fn().mockReturnValue(mockTokenERC20),
      });

      const result = await getERC20Operations([mockThirdwebTransactions]);

      expect(result).toEqual([]);
    });
  });

  describe("parseThirdwebTransactionParams", () => {
    it("should parse valid transaction params", () => {
      const mockTransaction = getMockedThirdwebTransaction({
        decoded: {
          name: "",
          signature: "",
          params: {
            from: "0x1234",
            to: "0x5678",
            value: "1000000",
          },
        },
      });

      const result = parseThirdwebTransactionParams(mockTransaction);

      expect(result).toEqual({
        from: mockTransaction.decoded.params.from,
        to: mockTransaction.decoded.params.to,
        value: mockTransaction.decoded.params.value,
      });
    });

    it("should return null if params are invalid", () => {
      const mockTransaction = getMockedThirdwebTransaction({
        decoded: {
          name: "",
          signature: "",
          params: {
            from: "0x1234",
            to: 123,
          },
        },
      });

      const result = parseThirdwebTransactionParams(mockTransaction);

      expect(result).toBeNull();
    });
  });

  describe("enrichERC20Transfers", () => {
    const payerAccountId = 1234;
    const erc20Token = SUPPORTED_ERC20_TOKENS[0];
    const mockMirrorTransaction = getMockedMirrorTransaction({
      entity_id: erc20Token.tokenId,
      consensus_timestamp: "1704067200.000000000",
      transaction_id: `0.0.${payerAccountId}-1704067200-000000000`,
      transaction_hash: "hash123",
      name: "CONTRACTCALL",
    });
    const mockERC20Transfer = getMockedERC20TokenTransfer({
      token_id: Number(erc20Token.tokenId.split(".").pop()),
      token_evm_address: erc20Token.contractAddress,
      consensus_timestamp: Number(mockMirrorTransaction.consensus_timestamp) * 10 ** 9,
      payer_account_id: payerAccountId,
      transaction_hash: mockMirrorTransaction.transaction_hash,
    });
    const mockContractCallResult = getMockedMirrorContractCallResult({
      contract_id: erc20Token.tokenId,
      timestamp: mockMirrorTransaction.consensus_timestamp,
    });

    beforeEach(() => {
      (apiClient.getContractCallResult as jest.Mock).mockResolvedValue(mockContractCallResult);
      (apiClient.findTransactionByContractCallV2 as jest.Mock).mockResolvedValue(
        mockMirrorTransaction,
      );
    });

    it("should enrich supported ERC20 transfers with contract call result and mirror transaction", async () => {
      const result = await enrichERC20Transfers([mockERC20Transfer]);

      expect(result).toEqual([
        {
          transfer: mockERC20Transfer,
          contractCallResult: mockContractCallResult,
          mirrorTransaction: mockMirrorTransaction,
        },
      ]);
      expect(apiClient.getContractCallResult).toHaveBeenCalledTimes(1);
      expect(apiClient.getContractCallResult).toHaveBeenCalledWith("hash123");
      expect(apiClient.findTransactionByContractCallV2).toHaveBeenCalledTimes(1);
      expect(apiClient.findTransactionByContractCallV2).toHaveBeenCalledWith({
        timestamp: "1704067200.000000000",
        payerAddress: `0.0.${payerAccountId}`,
      });
    });

    it("should skip transfers where mirror transaction is not found", async () => {
      (apiClient.findTransactionByContractCallV2 as jest.Mock).mockResolvedValue(null);

      const result = await enrichERC20Transfers([mockERC20Transfer]);

      expect(result).toEqual([]);
    });

    it("should handle multiple transfers", async () => {
      const transfers = [mockERC20Transfer, { ...mockERC20Transfer, transaction_hash: "hash456" }];

      (apiClient.findTransactionByContractCallV2 as jest.Mock).mockResolvedValue(
        mockMirrorTransaction,
      );

      const result = await enrichERC20Transfers(transfers);
      const txHashes = result.map(r => r.transfer.transaction_hash);

      expect(txHashes).toEqual([mockERC20Transfer.transaction_hash, "hash456"]);
    });

    it("should correctly convert consensus timestamp to seconds format", async () => {
      const transferWithTimestamp = {
        ...mockERC20Transfer,
        consensus_timestamp: 1768092990 * 10 ** 9,
      };

      await enrichERC20Transfers([transferWithTimestamp]);

      expect(apiClient.findTransactionByContractCallV2).toHaveBeenCalledTimes(1);
      expect(apiClient.findTransactionByContractCallV2).toHaveBeenCalledWith({
        timestamp: "1768092990.000000000",
        payerAddress: `0.0.${payerAccountId}`,
      });
    });

    it("should handle empty array", async () => {
      const result = await enrichERC20Transfers([]);

      expect(result).toEqual([]);
      expect(apiClient.getContractCallResult).not.toHaveBeenCalled();
      expect(apiClient.findTransactionByContractCallV2).not.toHaveBeenCalled();
    });
  });
});
