import BigNumber from "bignumber.js";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { apiClient } from "./api";
import { SUPPORTED_ERC20_TOKENS } from "../constants";
import { hgraphClient } from "./hgraph";
import { getMockedAccount } from "../test/fixtures/account.fixture";
import { getMockedCurrency, getMockedERC20TokenCurrency } from "../test/fixtures/currency.fixture";
import {
  getMockedERC20TokenBalance,
  getMockedERC20TokenTransfer,
} from "../test/fixtures/hgraph.fixture";
import {
  createMirrorCoinTransfer,
  createMirrorTokenTransfer,
  getMockedMirrorContractCallResult,
  getMockedMirrorTransaction,
} from "../test/fixtures/mirror.fixture";
import type { HederaMirrorCoinTransfer } from "../types";
import { enrichERC20Transfers, getERC20BalancesForAccount, parseTransfers } from "./utils";

jest.mock("./api");
jest.mock("./hgraph");

describe("network utils", () => {
  const mockCurrency = getMockedCurrency();

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
    it("returns balances only for supported ERC20 tokens and calls hgraphClient.getERC20Balances accordingly", async () => {
      const mockAccount = getMockedAccount();
      const erc20Token = getMockedERC20TokenCurrency();

      (hgraphClient.getERC20Balances as jest.Mock).mockResolvedValue([
        getMockedERC20TokenBalance({ token_id: 0, balance: 100 }),
        getMockedERC20TokenBalance({ token_id: 1, balance: 200 }),
        getMockedERC20TokenBalance({ token_id: 2, balance: 300 }),
      ]);
      setupMockCryptoAssetsStore({
        findTokenById: jest.fn().mockReturnValue(erc20Token),
      });

      const res = await getERC20BalancesForAccount({
        currency: mockCurrency,
        address: mockAccount.freshAddress,
      });

      expect(hgraphClient.getERC20Balances).toHaveBeenCalledTimes(1);
      expect(hgraphClient.getERC20Balances).toHaveBeenCalledWith({
        currency: mockCurrency,
        address: mockAccount.freshAddress,
      });
      expect(res).toEqual([]);
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
      (apiClient.findTransactionByContractCall as jest.Mock).mockResolvedValue(
        mockMirrorTransaction,
      );
    });

    it("should enrich supported ERC20 transfers with contract call result and mirror transaction", async () => {
      const result = await enrichERC20Transfers({
        currency: mockCurrency,
        erc20Transfers: [mockERC20Transfer],
      });

      expect(result).toEqual([
        {
          transfer: mockERC20Transfer,
          contractCallResult: mockContractCallResult,
          mirrorTransaction: mockMirrorTransaction,
        },
      ]);
      expect(apiClient.getContractCallResult).toHaveBeenCalledWith({
        currency: mockCurrency,
        transactionHash: "hash123",
      });
      expect(apiClient.findTransactionByContractCall).toHaveBeenCalledWith({
        currency: mockCurrency,
        timestamp: "1704067200.000000000",
        payerAddress: `0.0.${payerAccountId}`,
      });
    });

    it("should skip transfers where mirror transaction is not found", async () => {
      (apiClient.findTransactionByContractCall as jest.Mock).mockResolvedValue(null);

      const result = await enrichERC20Transfers({
        currency: mockCurrency,
        erc20Transfers: [mockERC20Transfer],
      });

      expect(result).toEqual([]);
    });

    it("should handle multiple transfers", async () => {
      const transfers = [mockERC20Transfer, { ...mockERC20Transfer, transaction_hash: "hash456" }];

      (apiClient.findTransactionByContractCall as jest.Mock).mockResolvedValue(
        mockMirrorTransaction,
      );

      const result = await enrichERC20Transfers({
        currency: mockCurrency,
        erc20Transfers: transfers,
      });
      const txHashes = result.map(r => r.transfer.transaction_hash);

      expect(txHashes).toEqual([mockERC20Transfer.transaction_hash, "hash456"]);
    });

    it("should correctly convert consensus timestamp to seconds format", async () => {
      const transferWithTimestamp = {
        ...mockERC20Transfer,
        consensus_timestamp: 1768092990 * 10 ** 9,
      };

      await enrichERC20Transfers({
        currency: mockCurrency,
        erc20Transfers: [transferWithTimestamp],
      });

      expect(apiClient.findTransactionByContractCall).toHaveBeenCalledWith({
        currency: mockCurrency,
        timestamp: "1768092990.000000000",
        payerAddress: `0.0.${payerAccountId}`,
      });
    });

    it("should handle empty array", async () => {
      const result = await enrichERC20Transfers({
        currency: mockCurrency,
        erc20Transfers: [],
      });

      expect(result).toEqual([]);
      expect(apiClient.getContractCallResult).not.toHaveBeenCalled();
      expect(apiClient.findTransactionByContractCall).not.toHaveBeenCalled();
    });
  });
});
