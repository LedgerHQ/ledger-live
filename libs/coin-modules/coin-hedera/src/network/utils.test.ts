import BigNumber from "bignumber.js";
import * as cryptoAssets from "@ledgerhq/coin-framework/crypto-assets/index";
import { apiClient } from "./api";
import { getMockedAccount } from "../test/fixtures/account.fixture";
import { getMockedERC20TokenCurrency } from "../test/fixtures/currency.fixture";
import {
  createMirrorCoinTransfer,
  createMirrorTokenTransfer,
} from "../test/fixtures/mirror.fixture";
import { getMockedThirdwebTransaction } from "../test/fixtures/thirdweb.fixture";
import type { HederaMirrorCoinTransfer } from "../types";
import {
  getERC20BalancesForAccount,
  getERC20Operations,
  parseThirdwebTransactionParams,
  parseTransfers,
} from "./utils";

jest.mock("./api");
jest.mock("@ledgerhq/coin-framework/crypto-assets/index");
jest.mock("@ledgerhq/cryptoassets/tokens");

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
      (cryptoAssets.getCryptoAssetsStore as jest.Mock).mockReturnValue({
        findTokenById: jest.fn().mockReturnValue(erc20Token),
      });

      const res = await getERC20BalancesForAccount(mockAccount.freshAddress);

      expect(apiClient.getERC20Balance).toHaveBeenCalledTimes(mockedSupportedTokenIds.length);
      expect(apiClient.getERC20Balance).toHaveBeenCalledWith(
        mockAccount.freshAddress,
        erc20Token.contractAddress,
      );

      expect(res).toHaveLength(mockedSupportedTokenIds.length);
      expect(res).toMatchObject(mockedResponse);
    });

    it("returns empty array when there are no supported ERC20 tokens", async () => {
      const supportedTokenIds: string[] = [];
      const res = await getERC20BalancesForAccount("0xaccount", supportedTokenIds);

      expect(res).toEqual([]);
      expect(apiClient.getERC20Balance).not.toHaveBeenCalled();
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

      (cryptoAssets.getCryptoAssetsStore as jest.Mock).mockReturnValue({
        findTokenByAddressInCurrency: jest.fn().mockReturnValue(mockTokenERC20),
      });
      (apiClient.getContractCallResult as jest.Mock).mockResolvedValue(mockContractCallResult);
      (apiClient.findTransactionByContractCall as jest.Mock).mockResolvedValue(
        mockMirrorTransaction,
      );

      const result = await getERC20Operations([mockThirdwebTransaction]);

      expect(result).toHaveLength(1);
      expect(result).toMatchObject([
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

      (cryptoAssets.getCryptoAssetsStore as jest.Mock).mockReturnValue({
        findTokenByAddressInCurrency: jest.fn().mockReturnValue(undefined),
      });
      const result = await getERC20Operations(mockThirdwebTransactions);

      expect(result).toHaveLength(0);
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

      (cryptoAssets.getCryptoAssetsStore as jest.Mock).mockReturnValue({
        findTokenByAddressInCurrency: jest.fn().mockReturnValue(mockTokenERC20),
      });
      (apiClient.getContractCallResult as jest.Mock).mockResolvedValue(
        mockContractCallResult as any,
      );
      (apiClient.findTransactionByContractCall as jest.Mock).mockResolvedValue(null);

      const result = await getERC20Operations([mockThirdwebTransactions]);

      expect(result).toHaveLength(0);
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
});
