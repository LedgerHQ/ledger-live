import { InvalidAddress } from "@ledgerhq/errors";
import { getEnv } from "@ledgerhq/live-env";
import BigNumber from "bignumber.js";
import { HederaRecipientInvalidChecksum } from "../errors";
import { getMockedAccount } from "../test/fixtures/account.fixture";
import { getMockedCurrency, getMockedHTSTokenCurrency } from "../test/fixtures/currency.fixture";
import {
  getMockedERC20TokenBalance,
  getMockedERC20TokenTransfer,
} from "../test/fixtures/hgraph.fixture";
import {
  createMirrorCoinTransfer,
  createMirrorTokenTransfer,
  getMockedMirrorTransaction,
  getMockedMirrorContractCallResult,
  getMockedMirrorAccount,
} from "../test/fixtures/mirror.fixture";
import { getMockedConfig } from "../test/fixtures/config.fixture";
import hederaCoinConfig from "../config";
import type { HederaMirrorCoinTransfer, HederaMirrorTransaction } from "../types";
import { apiClient } from "./api";
import { hgraphClient } from "./hgraph";
import { rpcClient } from "./rpc";
import {
  analyzeStakingOperation,
  calculateUncommittedBalanceChange,
  checkAccountTokenAssociationStatus,
  createTransactionId,
  enrichERC20Transfers,
  getERC20BalancesForAccountV2,
  parseTransfers,
  safeParseAccountId,
  toEVMAddress,
} from "./utils";

jest.mock("./api");
jest.mock("./hgraph");
jest.mock("./rpc", () => ({
  rpcClient: require("../test/fixtures/rpc.fixture").getMockedRpcClient(),
}));

describe("network utils", () => {
  const defaultConfig = getMockedConfig();
  const mockCurrency = getMockedCurrency();

  beforeAll(() => {
    hederaCoinConfig.setCoinConfig(getMockedConfig);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await rpcClient._resetInstance();
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

  describe("getERC20BalancesForAccountV2", () => {
    it("returns token balances and calls hgraphClient.getERC20Balances accordingly", async () => {
      const mockAccount = getMockedAccount();
      const mockRawToken1 = { token_id: 1, token_evm_address: "0x000000001" };
      const mockRawToken2 = { token_id: 2, token_evm_address: "0x000000002" };
      const mockRawToken3 = { token_id: 3, token_evm_address: "0x000000003" };

      (hgraphClient.getERC20Balances as jest.Mock).mockResolvedValue([
        getMockedERC20TokenBalance({ ...mockRawToken1, balance: 100 }),
        getMockedERC20TokenBalance({ ...mockRawToken2, balance: 200 }),
        getMockedERC20TokenBalance({ ...mockRawToken3, balance: 300 }),
      ]);

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
          balance: new BigNumber(100),
          contractAddress: mockRawToken1.token_evm_address,
        },
        {
          balance: new BigNumber(200),
          contractAddress: mockRawToken2.token_evm_address,
        },
        {
          balance: new BigNumber(300),
          contractAddress: mockRawToken3.token_evm_address,
        },
      ]);
    });
  });

  describe("enrichERC20Transfers", () => {
    const payerAccountId = 1234;
    const erc20Token = { tokenId: "0.0.1", contractAddress: "0x000000001" };
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

  describe("checkAccountTokenAssociationStatus", () => {
    const accountId = "0.0.1234";
    const htsToken = getMockedHTSTokenCurrency({ contractAddress: "0.0.1234", tokenType: "hts" });
    const erc20Token = getMockedHTSTokenCurrency({
      contractAddress: "0.0.4321",
      tokenType: "erc20",
    });

    beforeEach(() => {
      jest.clearAllMocks();
      // reset LRU cache to make sure all tests receive correct mocks from mockedGetAccount
      checkAccountTokenAssociationStatus.clear(`${accountId}-${htsToken.contractAddress}`);
    });

    it("returns true if max_automatic_token_associations === -1", async () => {
      (apiClient.getAccount as jest.Mock).mockResolvedValueOnce({
        account: accountId,
        max_automatic_token_associations: -1,
        balance: {
          balance: 0,
          timestamp: "",
          tokens: [],
        },
      });

      const result = await checkAccountTokenAssociationStatus(accountId, htsToken);
      expect(result).toBe(true);
    });

    it("returns true if token is already associated", async () => {
      (apiClient.getAccount as jest.Mock).mockResolvedValueOnce({
        account: accountId,
        max_automatic_token_associations: 0,
        balance: {
          balance: 1,
          timestamp: "",
          tokens: [{ token_id: htsToken.contractAddress, balance: 1 }],
        },
      });

      const result = await checkAccountTokenAssociationStatus(accountId, htsToken);
      expect(result).toBe(true);
    });

    it("returns false if token is not associated", async () => {
      (apiClient.getAccount as jest.Mock).mockResolvedValueOnce({
        account: accountId,
        max_automatic_token_associations: 0,
        balance: {
          balance: 1,
          timestamp: "",
          tokens: [{ token_id: "0.1234", balance: 1 }],
        },
      });

      const result = await checkAccountTokenAssociationStatus(accountId, htsToken);
      expect(result).toBe(false);
    });

    it("returns true for erc20 tokens", async () => {
      const result = await checkAccountTokenAssociationStatus(accountId, erc20Token);
      expect(apiClient.getAccount as jest.Mock).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("supports addresses with checksum", async () => {
      const addressWithChecksum = "0.0.9124531-xrxlv";

      (apiClient.getAccount as jest.Mock).mockResolvedValueOnce({
        account: accountId,
        max_automatic_token_associations: 0,
        balance: {
          balance: 1,
          timestamp: "",
          tokens: [{ token_id: htsToken.contractAddress, balance: 1 }],
        },
      });

      await checkAccountTokenAssociationStatus(addressWithChecksum, htsToken);
      expect(apiClient.getAccount).toHaveBeenCalledTimes(1);
      expect(apiClient.getAccount).toHaveBeenCalledWith({
        configOrCurrencyId: htsToken.parentCurrencyId,
        address: "0.0.9124531",
      });
    });
  });

  describe("safeParseAccountId", () => {
    it("returns account id and no checksum for valid address without checksum", async () => {
      const [error, result] = await safeParseAccountId({
        configOrCurrencyId: defaultConfig,
        address: "0.0.9124531",
      });

      expect(error).toBeNull();
      expect(result?.accountId).toBe("0.0.9124531");
      expect(result?.checksum).toBeNull();
    });

    it("returns account id and checksum for valid address with correct checksum", async () => {
      const [error, result] = await safeParseAccountId({
        configOrCurrencyId: defaultConfig,
        address: "0.0.9124531-xrxlv",
      });

      expect(error).toBeNull();
      expect(result?.accountId).toBe("0.0.9124531");
      expect(result?.checksum).toBe("xrxlv");
    });

    it("returns error for valid address with incorrect checksum", async () => {
      const [error, accountId] = await safeParseAccountId({
        configOrCurrencyId: defaultConfig,
        address: "0.0.9124531-invld",
      });

      expect(error).toBeInstanceOf(HederaRecipientInvalidChecksum);
      expect(accountId).toBeNull();
    });

    it("returns error for invalid address format", async () => {
      const [error, accountId] = await safeParseAccountId({
        configOrCurrencyId: defaultConfig,
        address: "not-a-valid-address",
      });

      expect(error).toBeInstanceOf(InvalidAddress);
      expect(accountId).toBeNull();
    });
  });

  describe("toEVMAddress", () => {
    const mockMirrorAccount = {
      account: "0.0.12345",
      evm_address: "0x0000000000000000000000000000000000003039",
    };

    it("returns correct EVM address for valid Hedera account ID", async () => {
      (apiClient.getAccount as jest.Mock).mockResolvedValueOnce(mockMirrorAccount);

      const evmAddress = await toEVMAddress({
        configOrCurrencyId: defaultConfig,
        accountId: mockMirrorAccount.account,
      });

      expect(apiClient.getAccount).toHaveBeenCalledTimes(1);
      expect(apiClient.getAccount).toHaveBeenCalledWith({
        configOrCurrencyId: defaultConfig,
        address: mockMirrorAccount.account,
      });
      expect(evmAddress).toBe(mockMirrorAccount.evm_address);
    });

    it("returns null when API call fails", async () => {
      (apiClient.getAccount as jest.Mock).mockRejectedValueOnce(new Error("API error"));

      const evmAddress = await toEVMAddress({
        configOrCurrencyId: defaultConfig,
        accountId: mockMirrorAccount.account,
      });

      expect(apiClient.getAccount).toHaveBeenCalledTimes(1);
      expect(evmAddress).toBeNull();
    });
  });

  describe("calculateUncommittedBalanceChange", () => {
    const mockAddress = "0.0.12345";
    const mockStartTimestamp = "1762202064.065172388";
    const mockEndTimestamp = "1762202074.065172388";

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return 0 when there are no transactions in the time range", async () => {
      (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValueOnce([]);

      const result = await calculateUncommittedBalanceChange({
        configOrCurrencyId: defaultConfig,
        address: mockAddress,
        startTimestamp: mockStartTimestamp,
        endTimestamp: mockEndTimestamp,
      });

      expect(result).toEqual(new BigNumber(0));
      expect(apiClient.getTransactionsByTimestampRange).toHaveBeenCalledTimes(1);
      expect(apiClient.getTransactionsByTimestampRange).toHaveBeenCalledWith({
        configOrCurrencyId: defaultConfig,
        address: mockAddress,
        startTimestamp: `gt:${mockStartTimestamp}`,
        endTimestamp: `lte:${mockEndTimestamp}`,
      });
    });

    it("should calculate balance change with mixed incoming and outgoing transfers", async () => {
      const mockTransactions = [
        {
          consensus_timestamp: "1762202065.000000000",
          transfers: [
            { account: mockAddress, amount: 2000 },
            { account: "0.0.98", amount: -2000 },
          ],
        },
        {
          consensus_timestamp: "1762202070.000000000",
          transfers: [
            { account: mockAddress, amount: -500 },
            { account: "0.0.99", amount: 500 },
          ],
        },
        {
          consensus_timestamp: "1762202072.000000000",
          transfers: [
            { account: mockAddress, amount: 300 },
            { account: "0.0.100", amount: -300 },
          ],
        },
      ] as HederaMirrorTransaction[];

      (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValueOnce(
        mockTransactions,
      );

      const result = await calculateUncommittedBalanceChange({
        configOrCurrencyId: defaultConfig,
        address: mockAddress,
        startTimestamp: mockStartTimestamp,
        endTimestamp: mockEndTimestamp,
      });

      expect(result).toEqual(new BigNumber(1800)); // 2000 - 500 + 300
    });

    it("should ignore transfers for other accounts", async () => {
      const mockTransactions = [
        {
          consensus_timestamp: "1762202065.000000000",
          transfers: [
            { account: "0.0.98", amount: 5000 },
            { account: "0.0.99", amount: -5000 },
          ],
        },
        {
          consensus_timestamp: "1762202070.000000000",
          transfers: [
            { account: mockAddress, amount: 1000 },
            { account: "0.0.100", amount: -1000 },
          ],
        },
      ] as HederaMirrorTransaction[];

      (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValueOnce(
        mockTransactions,
      );

      const result = await calculateUncommittedBalanceChange({
        configOrCurrencyId: defaultConfig,
        address: mockAddress,
        startTimestamp: mockStartTimestamp,
        endTimestamp: mockEndTimestamp,
      });

      expect(result).toEqual(new BigNumber(1000));
    });

    it("should return 0 when timestamps are equal or invalid", async () => {
      (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValueOnce([]);

      const [resultEqual, resultInvalid] = await Promise.all([
        calculateUncommittedBalanceChange({
          configOrCurrencyId: defaultConfig,
          address: mockAddress,
          startTimestamp: mockStartTimestamp,
          endTimestamp: mockStartTimestamp,
        }),
        calculateUncommittedBalanceChange({
          configOrCurrencyId: defaultConfig,
          address: mockAddress,
          startTimestamp: mockEndTimestamp,
          endTimestamp: mockStartTimestamp,
        }),
      ]);

      expect(resultEqual).toEqual(new BigNumber(0));
      expect(resultInvalid).toEqual(new BigNumber(0));
    });
  });

  describe("analyzeStakingOperation", () => {
    const mockAddress = "0.0.12345";
    const mockTimestamp = "1762202064.065172388";
    const mockTx = {
      consensus_timestamp: mockTimestamp,
      name: "CRYPTOUPDATEACCOUNT",
    } as HederaMirrorTransaction;

    beforeEach(() => {
      jest.resetAllMocks();
    });

    it("detects DELEGATE operation when staking starts", async () => {
      const accountBefore = getMockedMirrorAccount({ staked_node_id: null });
      const accountAfter = getMockedMirrorAccount({ staked_node_id: 5 });

      (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValueOnce([]);
      (apiClient.getAccount as jest.Mock)
        .mockResolvedValueOnce(accountBefore)
        .mockResolvedValueOnce(accountAfter);

      const result = await analyzeStakingOperation({
        configOrCurrencyId: defaultConfig,
        address: mockAddress,
        mirrorTx: mockTx,
      });

      expect(result).toEqual({
        operationType: "DELEGATE",
        previousStakingNodeId: null,
        targetStakingNodeId: 5,
        stakedAmount: BigInt(1000),
      });
      expect(apiClient.getAccount).toHaveBeenCalledTimes(2);
      expect(apiClient.getAccount).toHaveBeenCalledWith({
        configOrCurrencyId: defaultConfig,
        address: mockAddress,
        timestamp: `lt:${mockTimestamp}`,
      });
      expect(apiClient.getAccount).toHaveBeenCalledWith({
        configOrCurrencyId: defaultConfig,
        address: mockAddress,
        timestamp: `eq:${mockTimestamp}`,
      });
    });

    it("detects UNDELEGATE operation when staking stops", async () => {
      const accountBefore = getMockedMirrorAccount({ staked_node_id: 5 });
      const accountAfter = getMockedMirrorAccount({ staked_node_id: null });

      (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValueOnce([]);
      (apiClient.getAccount as jest.Mock)
        .mockResolvedValueOnce(accountBefore)
        .mockResolvedValueOnce(accountAfter);

      const result = await analyzeStakingOperation({
        configOrCurrencyId: defaultConfig,
        address: mockAddress,
        mirrorTx: mockTx,
      });

      expect(result).toEqual({
        operationType: "UNDELEGATE",
        previousStakingNodeId: 5,
        targetStakingNodeId: null,
        stakedAmount: BigInt(1000),
      });
    });

    it("detects REDELEGATE operation when changing nodes", async () => {
      const accountBefore = getMockedMirrorAccount({ staked_node_id: 3 });
      const accountAfter = getMockedMirrorAccount({ staked_node_id: 10 });

      (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValueOnce([]);
      (apiClient.getAccount as jest.Mock)
        .mockResolvedValueOnce(accountBefore)
        .mockResolvedValueOnce(accountAfter);

      const result = await analyzeStakingOperation({
        configOrCurrencyId: defaultConfig,
        address: mockAddress,
        mirrorTx: mockTx,
      });

      expect(result).toEqual({
        operationType: "REDELEGATE",
        previousStakingNodeId: 3,
        targetStakingNodeId: 10,
        stakedAmount: BigInt(1000),
      });
    });

    it("calculates correct staked amount with uncommitted transactions", async () => {
      const mockBalance = { balance: 1000000, timestamp: "1762202060.000000000", tokens: [] };
      const mockAccountBefore = getMockedMirrorAccount({
        account: mockAddress,
        staked_node_id: null,
        balance: mockBalance,
      });
      const mockAccountAfter = getMockedMirrorAccount({
        account: mockAddress,
        staked_node_id: 5,
        balance: mockBalance,
      });
      const mockTransactionsMissingInBalance = [
        {
          consensus_timestamp: `${Math.floor(Number(mockBalance.timestamp)) + 5}.000000000`,
          transfers: [
            { account: mockAddress, amount: -100000 },
            { account: "0.0.98", amount: 100000 },
          ],
        },
      ] as HederaMirrorTransaction[];

      (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValueOnce(
        mockTransactionsMissingInBalance,
      );
      (apiClient.getAccount as jest.Mock)
        .mockResolvedValueOnce(mockAccountBefore)
        .mockResolvedValueOnce(mockAccountAfter);

      const result = await analyzeStakingOperation({
        configOrCurrencyId: defaultConfig,
        address: mockAddress,
        mirrorTx: mockTx,
      });

      expect(apiClient.getTransactionsByTimestampRange).toHaveBeenCalledTimes(1);
      expect(apiClient.getTransactionsByTimestampRange).toHaveBeenCalledWith({
        configOrCurrencyId: defaultConfig,
        address: mockAddress,
        startTimestamp: `gt:${mockAccountBefore.balance.timestamp}`,
        endTimestamp: `lte:${mockTimestamp}`,
      });
      expect(result).toEqual({
        operationType: "DELEGATE",
        previousStakingNodeId: null,
        targetStakingNodeId: 5,
        stakedAmount: BigInt(900000),
      });
    });

    it("returns null for regular account update (both null)", async () => {
      const accountBefore = getMockedMirrorAccount({ staked_node_id: null });
      const accountAfter = getMockedMirrorAccount({ staked_node_id: null });

      (apiClient.getAccount as jest.Mock)
        .mockResolvedValueOnce(accountBefore)
        .mockResolvedValueOnce(accountAfter);

      const result = await analyzeStakingOperation({
        configOrCurrencyId: defaultConfig,
        address: mockAddress,
        mirrorTx: mockTx,
      });

      expect(result).toBeNull();
    });

    it("returns null when staked node doesn't change", async () => {
      const accountBefore = getMockedMirrorAccount({ staked_node_id: 5 });
      const accountAfter = getMockedMirrorAccount({ staked_node_id: 5 });

      (apiClient.getAccount as jest.Mock)
        .mockResolvedValueOnce(accountBefore)
        .mockResolvedValueOnce(accountAfter);

      const result = await analyzeStakingOperation({
        configOrCurrencyId: defaultConfig,
        address: mockAddress,
        mirrorTx: mockTx,
      });

      expect(result).toBeNull();
    });
  });
});
