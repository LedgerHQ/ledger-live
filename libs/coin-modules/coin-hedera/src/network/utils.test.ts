import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { getEnv } from "@ledgerhq/live-env";
import BigNumber from "bignumber.js";
import { SUPPORTED_ERC20_TOKENS } from "../constants";
import { getMockedAccount } from "../test/fixtures/account.fixture";
import { getMockedCurrency, getMockedERC20TokenCurrency } from "../test/fixtures/currency.fixture";
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
import { getMockedConfig } from "../test/fixtures/config.fixture";
import { getMockedThirdwebTransaction } from "../test/fixtures/thirdweb.fixture";
import type { HederaMirrorCoinTransfer } from "../types";
import { apiClient } from "./api";
import { hgraphClient } from "./hgraph";
import {
  createTransactionId,
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
  const defaultConfig = getMockedConfig();
  const mockCurrency = getMockedCurrency();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("createTransactionId", () => {
    it("should use mirror node timestamp when feature flag is enabled", async () => {
      (apiClient.getLatestBlock as jest.Mock).mockResolvedValue({
        timestamp: { from: "1758733200.632122898", to: null },
      });

      const result = await createTransactionId("0.0.54321", {
        ...defaultConfig,
        useNetworkTimestamp: true,
      });

      expect(apiClient.getLatestBlock).toHaveBeenCalledTimes(1);
      expect(result.validStart?.seconds.toString()).toEqual("1758733200");
      expect(result.validStart?.nanos.toString()).toEqual("632122898");
    });

    it("should fallback to system timestamp when latest block fetch fails", async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2000-01-01T00:00:00.000Z"));
      (apiClient.getLatestBlock as jest.Mock).mockRejectedValue(new Error("network unavailable"));

      const result = await createTransactionId("0.0.54321", {
        ...defaultConfig,
        useNetworkTimestamp: true,
      });

      const localSkewSeconds = Number(result.validStart?.seconds.toString());
      expect(apiClient.getLatestBlock).toHaveBeenCalledTimes(1);
      expect(localSkewSeconds).toBeGreaterThanOrEqual(946684700);
      expect(localSkewSeconds).toBeLessThanOrEqual(946684800);
    });

    it("should use system timestamp when feature flag is disabled", async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2000-01-01T00:00:00.000Z"));

      const result = await createTransactionId("0.0.54321", {
        ...defaultConfig,
        useNetworkTimestamp: false,
      });

      const localSkewSeconds = Number(result.validStart?.seconds.toString());
      expect(apiClient.getLatestBlock).not.toHaveBeenCalled();
      expect(localSkewSeconds).toBeGreaterThanOrEqual(946684700);
      expect(localSkewSeconds).toBeLessThanOrEqual(946684800);
    });
  });

  describe("parseTransfers", () => {
    const userAddress = "0.0.1234";
    const rewardPayer = getEnv("HEDERA_STAKING_REWARD_ACCOUNT_ID");

    it("should correctly identify an incoming transfer", () => {
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
      const transfers: HederaMirrorCoinTransfer[] = [];

      const result = parseTransfers(transfers, userAddress);

      expect(result.type).toBe("NONE");
      expect(result.value).toEqual(new BigNumber(0));
      expect(result.senders).toEqual([]);
      expect(result.recipients).toEqual([]);
    });

    it("should reverse the order of senders and recipients", () => {
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

    it("should subtract staking reward from amount", () => {
      const amount = new BigNumber(30);
      const stakingReward = new BigNumber(20);
      const transfers = [createMirrorCoinTransfer(userAddress, amount.toNumber())];

      const expectedAmountWithoutReward = amount.minus(stakingReward);
      const result = parseTransfers(transfers, userAddress, stakingReward);

      expect(result).toMatchObject({
        type: "IN",
        value: expectedAmountWithoutReward,
      });
    });

    it("excludes reward payer from senders when staking reward is present", () => {
      const stakingReward = new BigNumber(30000000);
      const transfers = [
        createMirrorCoinTransfer(rewardPayer, -30000000),
        createMirrorCoinTransfer("0.0.801", 1000),
        createMirrorCoinTransfer(userAddress, 30000000),
      ];

      const result = parseTransfers(transfers, userAddress, stakingReward);

      expect(result.senders).not.toContain(rewardPayer);
    });

    it("includes reward payer in senders when no staking reward", () => {
      const transfers = [
        createMirrorCoinTransfer(rewardPayer, -1000000),
        createMirrorCoinTransfer(userAddress, 1000000),
      ];

      const result = parseTransfers(transfers, userAddress);

      expect(result.senders).toContain(rewardPayer);
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

      const res = await getERC20BalancesForAccount({
        configOrCurrencyId: mockCurrency.id,
        evmAccountId: mockAccount.freshAddress,
        supportedTokenIds: mockedSupportedTokenIds,
      });

      expect(apiClient.getERC20Balance).toHaveBeenCalledTimes(mockedSupportedTokenIds.length);
      expect(apiClient.getERC20Balance).toHaveBeenCalledWith({
        configOrCurrencyId: mockCurrency.id,
        accountEvmAddress: mockAccount.freshAddress,
        contractEvmAddress: erc20Token.contractAddress,
      });

      expect(res).toEqual(mockedResponse);
    });

    it("returns empty array when there are no supported ERC20 tokens", async () => {
      const supportedTokenIds: string[] = [];
      const res = await getERC20BalancesForAccount({
        configOrCurrencyId: "hedera",
        evmAccountId: "0xaccount",
        supportedTokenIds,
      });

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

      const res = await getERC20BalancesForAccountV2({
        configOrCurrencyId: mockCurrency.id,
        address: mockAccount.freshAddress,
      });

      expect(hgraphClient.getERC20Balances).toHaveBeenCalledTimes(1);
      expect(hgraphClient.getERC20Balances).toHaveBeenCalledWith({
        configOrCurrencyId: mockCurrency.id,
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
      const mockContractCallResult = getMockedMirrorContractCallResult({
        timestamp: "1234567890.000000000",
        contract_id: mockTokenERC20.contractAddress,
        gas_consumed: 50000,
        gas_limit: 100000,
        gas_used: 50000,
      });
      const mockMirrorTransaction = getMockedMirrorTransaction({
        consensus_timestamp: mockContractCallResult.timestamp,
        transaction_hash: "BASE64HASH",
        transaction_id: "0.0.123@1234567890.000",
        charged_tx_fee: 100000,
        memo_base64: "",
      });

      (apiClient.getContractCallResult as jest.Mock).mockResolvedValue(mockContractCallResult);
      (apiClient.findTransactionByContractCall as jest.Mock).mockResolvedValue(
        mockMirrorTransaction,
      );
      setupMockCryptoAssetsStore({
        findTokenByAddressInCurrency: jest.fn().mockReturnValue(mockTokenERC20),
      });

      const result = await getERC20Operations({
        currencyId: mockCurrency.id,
        latestERC20Transactions: [mockThirdwebTransaction],
      });

      expect(result).toEqual([
        {
          thirdwebTransaction: mockThirdwebTransaction,
          mirrorTransaction: mockMirrorTransaction,
          contractCallResult: mockContractCallResult,
          token: mockTokenERC20,
        },
      ]);
      expect(apiClient.getContractCallResult).toHaveBeenCalledTimes(1);
      expect(apiClient.getContractCallResult).toHaveBeenCalledWith({
        configOrCurrencyId: mockCurrency.id,
        transactionHash: mockThirdwebTransaction.transactionHash,
      });
      expect(apiClient.findTransactionByContractCall).toHaveBeenCalledTimes(1);
      expect(apiClient.findTransactionByContractCall).toHaveBeenCalledWith({
        configOrCurrencyId: mockCurrency.id,
        timestamp: mockContractCallResult.timestamp,
        contractId: mockTokenERC20.contractAddress,
      });
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

      const result = await getERC20Operations({
        currencyId: mockCurrency.id,
        latestERC20Transactions: mockThirdwebTransactions,
      });

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
      const mockContractCallResult = getMockedMirrorContractCallResult({
        timestamp: "1234567890.000000000",
        contract_id: mockTokenERC20.contractAddress,
      });

      (apiClient.getContractCallResult as jest.Mock).mockResolvedValue(mockContractCallResult);
      (apiClient.findTransactionByContractCall as jest.Mock).mockResolvedValue(null);
      setupMockCryptoAssetsStore({
        findTokenByAddressInCurrency: jest.fn().mockReturnValue(mockTokenERC20),
      });

      const result = await getERC20Operations({
        currencyId: mockCurrency.id,
        latestERC20Transactions: [mockThirdwebTransactions],
      });

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
      const result = await enrichERC20Transfers({
        configOrCurrencyId: mockCurrency.id,
        erc20Transfers: [mockERC20Transfer],
      });

      expect(result).toEqual([
        {
          transfers: [mockERC20Transfer],
          contractCallResult: mockContractCallResult,
          mirrorTransaction: mockMirrorTransaction,
        },
      ]);
      expect(apiClient.getContractCallResult).toHaveBeenCalledTimes(1);
      expect(apiClient.getContractCallResult).toHaveBeenCalledWith({
        configOrCurrencyId: mockCurrency.id,
        transactionHash: mockMirrorTransaction.transaction_hash,
      });
      expect(apiClient.findTransactionByContractCallV2).toHaveBeenCalledTimes(1);
      expect(apiClient.findTransactionByContractCallV2).toHaveBeenCalledWith({
        configOrCurrencyId: mockCurrency.id,
        timestamp: "1704067200.000000000",
        payerAddress: `0.0.${payerAccountId}`,
      });
    });

    it("should group multiple transfers with the same transaction hash into one enriched result", async () => {
      const transfer1 = { ...mockERC20Transfer, amount: 1000 };
      const transfer2 = { ...mockERC20Transfer, amount: 2000 }; // same transaction_hash

      const result = await enrichERC20Transfers({
        configOrCurrencyId: mockCurrency.id,
        erc20Transfers: [transfer1, transfer2],
      });

      expect(result).toEqual([
        expect.objectContaining({
          transfers: [transfer1, transfer2],
        }),
      ]);
    });

    it("should skip transfers where mirror transaction is not found", async () => {
      (apiClient.findTransactionByContractCallV2 as jest.Mock).mockResolvedValue(null);

      const result = await enrichERC20Transfers({
        configOrCurrencyId: mockCurrency.id,
        erc20Transfers: [mockERC20Transfer],
      });

      expect(result).toEqual([]);
    });

    it("should handle multiple transfers", async () => {
      const transfers = [mockERC20Transfer, { ...mockERC20Transfer, transaction_hash: "hash456" }];

      (apiClient.findTransactionByContractCallV2 as jest.Mock).mockResolvedValue(
        mockMirrorTransaction,
      );

      const result = await enrichERC20Transfers({
        configOrCurrencyId: mockCurrency.id,
        erc20Transfers: transfers,
      });
      const txHashes = result.flatMap(r => r.transfers.map(t => t.transaction_hash));

      expect(txHashes).toEqual([mockERC20Transfer.transaction_hash, "hash456"]);
    });

    it("should correctly convert consensus timestamp to seconds format", async () => {
      const transferWithTimestamp = {
        ...mockERC20Transfer,
        consensus_timestamp: 1768092990 * 10 ** 9,
      };

      await enrichERC20Transfers({
        configOrCurrencyId: mockCurrency.id,
        erc20Transfers: [transferWithTimestamp],
      });

      expect(apiClient.findTransactionByContractCallV2).toHaveBeenCalledTimes(1);
      expect(apiClient.findTransactionByContractCallV2).toHaveBeenCalledWith({
        configOrCurrencyId: mockCurrency.id,
        timestamp: "1768092990.000000000",
        payerAddress: `0.0.${payerAccountId}`,
      });
    });

    it("should handle empty array", async () => {
      const result = await enrichERC20Transfers({
        configOrCurrencyId: mockCurrency.id,
        erc20Transfers: [],
      });

      expect(result).toEqual([]);
      expect(apiClient.getContractCallResult).not.toHaveBeenCalled();
      expect(apiClient.findTransactionByContractCallV2).not.toHaveBeenCalled();
    });
  });
});
