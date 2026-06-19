import BigNumber from "bignumber.js";
import type { TokenAccount } from "@ledgerhq/types-live";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/accountId";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { apiClient } from "../network/api";
import {
  getMockedAccount,
  getMockedTokenAccount,
  mockUnspentTokenRecord1,
} from "../__tests__/fixtures/account.fixture";
import {
  getMockedCurrency,
  getMockedTokenCurrency,
  MOCK_TOKEN_PROGRAM_ID,
} from "../__tests__/fixtures/currency.fixture";
import { getMockedOperation } from "../__tests__/fixtures/operation.fixture";
import type { AleoOperation, AleoTokenAccount, AleoPrivateTokenBalance } from "../types";
import { getMockedRecord, MOCK_ALEO_ADDRESS } from "../__tests__/fixtures/api.fixture";
import { EXPLORER_TRANSFER_TYPES, TOKEN_RECORD_NAME } from "../constants";
import type { AleoPrivateRecord } from "../types";
import { sdkClient } from "../network/sdk";
import { log } from "@ledgerhq/logs";
import {
  applyTransparentBalance,
  attachPrivateTokenOpsToParent,
  buildPrivateTokenOp,
  buildSubAccountsFromPrivateRecords,
  filterHistoryRecords,
  mergeSubAccounts,
  patchTokenSubAccountOps,
  prepareTokenOperations,
  resolveTokenSubAccounts,
  withPrivateBalance,
} from "./tokens";

jest.mock("@ledgerhq/logs", () => ({
  log: jest.fn(),
}));

jest.mock("../network/api");
jest.mock("../network/sdk");

const mockGetTokenBalance = jest.mocked(apiClient.getTokenBalance);
const mockDecryptRecord = jest.mocked(sdkClient.decryptRecord);
const mockGetTransactionById = jest.mocked(apiClient.getTransactionById);

const mockCurrency = getMockedCurrency();
const mockTokenCurrency = getMockedTokenCurrency();
const mockLedgerAccountId = encodeAccountId({
  type: "js",
  version: "2",
  currencyId: mockCurrency.id,
  xpubOrAddress: MOCK_ALEO_ADDRESS,
  derivationMode: "",
  customData: "AViewKey123",
});
const ledgerAccountId = mockLedgerAccountId;
const address = MOCK_ALEO_ADDRESS;
const tokenAccountId = encodeTokenAccountId(ledgerAccountId, mockTokenCurrency);

function getTestTokenAccount(overrides?: Partial<AleoTokenAccount>): AleoTokenAccount {
  return getMockedTokenAccount(mockTokenCurrency, {
    id: tokenAccountId,
    parentId: ledgerAccountId,
    ...overrides,
  });
}

function getMockedTokenPrivateRecord(overrides?: Partial<AleoPrivateRecord>): AleoPrivateRecord {
  return getMockedRecord({
    program_name: MOCK_TOKEN_PROGRAM_ID,
    record_name: TOKEN_RECORD_NAME,
    function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
    ...overrides,
  });
}

function getMockedTokenOperation(overrides?: Partial<AleoOperation>): AleoOperation {
  return getMockedOperation({
    type: "NONE",
    accountId: ledgerAccountId,
    recipients: [address],
    senders: ["aleo1sender"],
    extra: {
      functionId: "transfer_public",
      transactionType: "public",
      programId: MOCK_TOKEN_PROGRAM_ID,
    },
    ...overrides,
  });
}

function assertAleoTokenAccount(subAccount: TokenAccount): asserts subAccount is AleoTokenAccount {
  expect(subAccount).toMatchObject({
    transparentBalance: expect.any(BigNumber),
    privateBalance: expect.anything(),
  });
}

describe("tokens utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMockCryptoAssetsStore({
      findTokenByAddressInCurrency: jest.fn().mockImplementation(async (programName: string) => {
        if (programName === MOCK_TOKEN_PROGRAM_ID) {
          return mockTokenCurrency;
        }
        return undefined;
      }),
    });
    mockGetTokenBalance.mockResolvedValue("250000u128");
  });

  describe("prepareTokenOperations", () => {
    it("should attach an IN sub-operation to the matching parent coin operation", async () => {
      const tokenOp = getMockedTokenOperation({ hash: "tx-in" });
      const parentOp = getMockedOperation({
        hash: "tx-in",
        type: "NONE",
        accountId: ledgerAccountId,
      });
      const calTokens = new Map([[MOCK_TOKEN_PROGRAM_ID, mockTokenCurrency]]);

      const { updatedCoinOperations, tokenOperationsBySubAccountId } = await prepareTokenOperations(
        {
          address,
          ledgerAccountId,
          publicOperations: [parentOp],
          tokenOperations: [tokenOp],
          calTokens,
        },
      );

      expect(updatedCoinOperations).toHaveLength(1);
      expect(updatedCoinOperations[0].subOperations).toEqual([
        expect.objectContaining({
          type: "IN",
          accountId: tokenAccountId,
          id: encodeOperationId(tokenAccountId, "tx-in", "IN"),
        }),
      ]);
      expect(tokenOperationsBySubAccountId.get(tokenAccountId)).toHaveLength(1);
    });

    it("should create a NONE parent and promote it to FEES for outgoing token transfers", async () => {
      const tokenOp = getMockedTokenOperation({
        hash: "tx-out",
        recipients: ["aleo1recipient"],
        senders: [address],
        fee: new BigNumber(42),
      });
      const calTokens = new Map([[MOCK_TOKEN_PROGRAM_ID, mockTokenCurrency]]);

      const { updatedCoinOperations } = await prepareTokenOperations({
        address,
        ledgerAccountId,
        publicOperations: [],
        tokenOperations: [tokenOp],
        calTokens,
      });

      expect(updatedCoinOperations).toHaveLength(1);
      expect(updatedCoinOperations[0]).toMatchObject({
        type: "FEES",
        value: new BigNumber(42),
        fee: new BigNumber(42),
        id: encodeOperationId(ledgerAccountId, "tx-out", "FEES"),
      });
      expect(updatedCoinOperations[0].subOperations?.[0]).toMatchObject({
        type: "OUT",
        accountId: tokenAccountId,
      });
    });

    it("should not duplicate sub-operations when the same token operation is processed twice", async () => {
      const tokenOp = getMockedTokenOperation({ hash: "tx-dup" });
      const calTokens = new Map([[MOCK_TOKEN_PROGRAM_ID, mockTokenCurrency]]);

      const { updatedCoinOperations, tokenOperationsBySubAccountId } = await prepareTokenOperations(
        {
          address,
          ledgerAccountId,
          publicOperations: [],
          tokenOperations: [tokenOp, tokenOp],
          calTokens,
        },
      );

      expect(updatedCoinOperations).toHaveLength(1);
      expect(updatedCoinOperations[0].subOperations).toHaveLength(1);
      expect(tokenOperationsBySubAccountId.get(tokenAccountId)).toHaveLength(1);
    });

    it("should skip token operations without programId or CAL match", async () => {
      const tokenOp = getMockedTokenOperation({
        extra: { functionId: "transfer_public", transactionType: "public" },
      });
      const calTokens = new Map([[MOCK_TOKEN_PROGRAM_ID, mockTokenCurrency]]);

      const { updatedCoinOperations, tokenOperationsBySubAccountId } = await prepareTokenOperations(
        {
          address,
          ledgerAccountId,
          publicOperations: [],
          tokenOperations: [tokenOp],
          calTokens,
        },
      );

      expect(updatedCoinOperations).toEqual([]);
      expect(tokenOperationsBySubAccountId.size).toBe(0);
    });
  });

  describe("mergeSubAccounts", () => {
    it("should return new sub-accounts when there is no initial account", () => {
      const newSubAccount = getMockedTokenAccount();

      expect(mergeSubAccounts(undefined, [newSubAccount])).toEqual([newSubAccount]);
    });

    it("should append sub-accounts that do not exist on the initial account", () => {
      const existingSubAccount = getMockedTokenAccount(mockTokenCurrency);
      const newToken = getMockedTokenCurrency({ id: "other-token", contractAddress: "other.aleo" });
      const newSubAccount = getMockedTokenAccount(newToken);
      const initialAccount = getMockedAccount({ subAccounts: [existingSubAccount] });

      const result = mergeSubAccounts(initialAccount, [newSubAccount]);

      expect(result).toHaveLength(2);
      expect(result.map(sa => sa.id)).toEqual(
        expect.arrayContaining([existingSubAccount.id, newSubAccount.id]),
      );
    });

    it("should merge operations for an existing sub-account id", () => {
      const existingOp = getMockedOperation({
        id: encodeOperationId(tokenAccountId, "old-tx", "IN"),
        hash: "old-tx",
        type: "IN",
        accountId: tokenAccountId,
      });
      const newOp = getMockedOperation({
        id: encodeOperationId(tokenAccountId, "new-tx", "OUT"),
        hash: "new-tx",
        type: "OUT",
        accountId: tokenAccountId,
      });
      const existingSubAccount = getTestTokenAccount({
        operations: [existingOp],
        operationsCount: 1,
      });
      const incomingSubAccount = getTestTokenAccount({
        balance: new BigNumber(999),
        spendableBalance: new BigNumber(999),
        operations: [newOp],
        operationsCount: 1,
      });
      const initialAccount = getMockedAccount({ subAccounts: [existingSubAccount] });

      const result = mergeSubAccounts(initialAccount, [incomingSubAccount]);

      expect(result).toHaveLength(1);
      expect(result[0].balance).toEqual(new BigNumber(999));
      expect(result[0].operations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ hash: "old-tx" }),
          expect.objectContaining({ hash: "new-tx" }),
        ]),
      );
    });
  });

  describe("applyTransparentBalance", () => {
    it("should use the fresh transparent balance from the API map", () => {
      const subAccount = getTestTokenAccount({
        transparentBalance: new BigNumber(100),
        privateBalance: new BigNumber(50),
      });
      const freshTransparentById = new Map([[tokenAccountId, new BigNumber(300)]]);

      const result = applyTransparentBalance(subAccount, freshTransparentById);

      expect(result.transparentBalance).toEqual(new BigNumber(300));
      expect(result.balance).toEqual(new BigNumber(350));
      expect(result.spendableBalance).toEqual(new BigNumber(350));
    });

    it("should fall back to stored transparent balance when token is absent from the fresh map", () => {
      const subAccount = getTestTokenAccount({
        transparentBalance: new BigNumber(120),
        privateBalance: null,
      });

      const result = applyTransparentBalance(subAccount, new Map());

      expect(result.transparentBalance).toEqual(new BigNumber(120));
      expect(result.balance).toEqual(new BigNumber(120));
    });
  });

  describe("resolveTokenSubAccounts", () => {
    it("should build sub-accounts with operations and transparent balances when tokens are enabled", async () => {
      const tokenOp = getMockedTokenOperation({ hash: "tx-token" });
      const calTokens = new Map([[MOCK_TOKEN_PROGRAM_ID, mockTokenCurrency]]);

      const { updatedCoinOperations, subAccounts } = await resolveTokenSubAccounts({
        enableTokens: true,
        currency: mockCurrency,
        address,
        ledgerAccountId,
        publicOperations: [],
        tokenOperations: [tokenOp],
        calTokens,
        shouldSyncFromScratch: true,
        initialAccount: undefined,
      });

      expect(updatedCoinOperations).toHaveLength(1);
      expect(updatedCoinOperations[0].type).toBe("NONE");
      expect(subAccounts).toHaveLength(1);
      expect(subAccounts[0]).toMatchObject({
        id: tokenAccountId,
        transparentBalance: new BigNumber(250000),
        balance: new BigNumber(250000),
        operationsCount: 1,
      });
      expect(mockGetTokenBalance).toHaveBeenCalledWith(
        mockCurrency,
        MOCK_TOKEN_PROGRAM_ID,
        MOCK_ALEO_ADDRESS,
      );
      expect(subAccounts[0].operations[0]).toMatchObject({
        type: "IN",
        accountId: tokenAccountId,
      });
      expect(mockGetTokenBalance).toHaveBeenCalledWith(
        mockCurrency,
        MOCK_TOKEN_PROGRAM_ID,
        address,
      );
    });

    it("should fetch transparent balances for pre-existing sub-accounts after merge", async () => {
      const existingSubAccount = getTestTokenAccount({
        transparentBalance: new BigNumber(100),
        privateBalance: new BigNumber(50),
        operations: [],
        operationsCount: 0,
      });
      const calTokens = new Map([[MOCK_TOKEN_PROGRAM_ID, mockTokenCurrency]]);
      mockGetTokenBalance.mockResolvedValue("400000u128");

      const { subAccounts } = await resolveTokenSubAccounts({
        enableTokens: true,
        currency: mockCurrency,
        address,
        ledgerAccountId,
        publicOperations: [],
        tokenOperations: [],
        calTokens,
        shouldSyncFromScratch: false,
        initialAccount: getMockedAccount({ subAccounts: [existingSubAccount] }),
      });

      expect(mockGetTokenBalance).toHaveBeenCalledWith(
        mockCurrency,
        MOCK_TOKEN_PROGRAM_ID,
        address,
      );
      expect(subAccounts).toHaveLength(1);
      const aleoSubAccount = subAccounts[0];
      assertAleoTokenAccount(aleoSubAccount);
      expect(aleoSubAccount.transparentBalance).toEqual(new BigNumber(400000));
      expect(aleoSubAccount.balance).toEqual(new BigNumber(400050));
    });

    it("should fall back to stored transparent balance when balance fetch fails", async () => {
      const existingSubAccount = getTestTokenAccount({
        transparentBalance: new BigNumber(120),
        privateBalance: new BigNumber(30),
      });
      mockGetTokenBalance.mockRejectedValue(new Error("API unavailable"));

      const { subAccounts } = await resolveTokenSubAccounts({
        enableTokens: true,
        currency: mockCurrency,
        address,
        ledgerAccountId,
        publicOperations: [],
        tokenOperations: [],
        calTokens: new Map([[MOCK_TOKEN_PROGRAM_ID, mockTokenCurrency]]),
        shouldSyncFromScratch: false,
        initialAccount: getMockedAccount({ subAccounts: [existingSubAccount] }),
      });

      const aleoSubAccount = subAccounts[0];
      assertAleoTokenAccount(aleoSubAccount);
      expect(aleoSubAccount.transparentBalance).toEqual(new BigNumber(120));
      expect(aleoSubAccount.balance).toEqual(new BigNumber(150));
      expect(log).toHaveBeenCalledWith(
        "aleo/resolveTokenSubAccounts",
        expect.stringContaining(MOCK_TOKEN_PROGRAM_ID),
      );
    });

    it("should fall back to stored transparent balance when getTokenBalance fails", async () => {
      mockGetTokenBalance.mockRejectedValueOnce(new Error("api down"));
      const subAccount = getTestTokenAccount({
        transparentBalance: new BigNumber(77),
        privateBalance: null,
      });
      const calTokens = new Map([[MOCK_TOKEN_PROGRAM_ID, mockTokenCurrency]]);

      const { subAccounts } = await resolveTokenSubAccounts({
        enableTokens: true,
        currency: mockCurrency,
        address,
        ledgerAccountId,
        publicOperations: [],
        tokenOperations: [],
        calTokens,
        shouldSyncFromScratch: false,
        initialAccount: getMockedAccount({ subAccounts: [subAccount] }),
      });

      const aleoSubAccount = subAccounts.find(
        (subAccount): subAccount is AleoTokenAccount => "transparentBalance" in subAccount,
      );
      expect(aleoSubAccount?.transparentBalance).toEqual(new BigNumber(77));
    });

    it("should clear sub-accounts and strip sub-operations when tokens are disabled", async () => {
      const tokenSubOp = getMockedOperation({
        hash: "tx-token",
        type: "IN",
        accountId: tokenAccountId,
      });
      const parentOp = getMockedOperation({
        hash: "tx-token",
        type: "NONE",
        accountId: ledgerAccountId,
        subOperations: [tokenSubOp],
      });
      const existingSubAccount = getMockedTokenAccount();

      const { updatedCoinOperations, subAccounts } = await resolveTokenSubAccounts({
        enableTokens: false,
        currency: mockCurrency,
        address,
        ledgerAccountId,
        publicOperations: [parentOp],
        tokenOperations: [getMockedTokenOperation({ hash: "tx-token" })],
        calTokens: new Map([[MOCK_TOKEN_PROGRAM_ID, mockTokenCurrency]]),
        shouldSyncFromScratch: false,
        initialAccount: getMockedAccount({ subAccounts: [existingSubAccount] }),
      });

      expect(updatedCoinOperations).toEqual([]);
      expect(subAccounts).toEqual([]);
    });
  });

  describe("filterHistoryRecords", () => {
    it("should keep only private transfer functions and deduplicate by commitment", () => {
      const transferRecord = getMockedTokenPrivateRecord({
        commitment: "commit-a",
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
      });
      const duplicateRecord = { ...transferRecord, tag: "other-tag" };
      const feeRecord = getMockedTokenPrivateRecord({
        commitment: "commit-fee",
        function_name: "fee_private",
      });

      const result = filterHistoryRecords([transferRecord, duplicateRecord, feeRecord]);

      expect(result).toHaveLength(1);
      expect(result[0].commitment).toBe("commit-a");
    });
  });

  describe("buildPrivateTokenOp", () => {
    it("should build an OUT operation when the record sender is the account address", () => {
      const record = getMockedTokenPrivateRecord({
        sender: address,
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
      });

      const op = buildPrivateTokenOp(
        tokenAccountId,
        "tx-out",
        {
          amount: new BigNumber(100),
          record,
          programId: MOCK_TOKEN_PROGRAM_ID,
          recipient: "aleo1recipient",
          fee: new BigNumber(5),
        },
        address,
      );

      expect(op).toMatchObject({
        type: "OUT",
        value: new BigNumber(100),
        senders: [address],
        recipients: ["aleo1recipient"],
        extra: { transactionType: "private", programId: MOCK_TOKEN_PROGRAM_ID },
      });
    });

    it("should build an IN operation for transfer_public_to_private self-transfers", () => {
      const record = getMockedTokenPrivateRecord({
        sender: address,
        function_name: EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE,
      });

      const op = buildPrivateTokenOp(
        tokenAccountId,
        "tx-shield",
        {
          amount: new BigNumber(250),
          record,
          programId: MOCK_TOKEN_PROGRAM_ID,
        },
        address,
      );

      expect(op).toMatchObject({
        type: "IN",
        value: new BigNumber(250),
        senders: [address],
        recipients: [address],
      });
    });

    it("should build an IN operation when the record sender is a third party", () => {
      const sender = "aleo1sender";
      const record = getMockedTokenPrivateRecord({ sender });

      const op = buildPrivateTokenOp(
        tokenAccountId,
        "tx-in",
        {
          amount: new BigNumber(50),
          record,
          programId: MOCK_TOKEN_PROGRAM_ID,
        },
        address,
      );

      expect(op).toMatchObject({
        type: "IN",
        senders: [sender],
        recipients: [address],
      });
    });
  });

  describe("patchTokenSubAccountOps", () => {
    it("should patch missing recipients on semi-public ops from a private op on the same hash", () => {
      const privateOp = getMockedOperation({
        hash: "tx-semi",
        type: "IN",
        accountId: tokenAccountId,
        senders: [address],
        recipients: [address],
        extra: {
          functionId: EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE,
          transactionType: "private",
          programId: MOCK_TOKEN_PROGRAM_ID,
        },
      });
      const publicOp = getMockedOperation({
        hash: "tx-semi",
        type: "OUT",
        accountId: tokenAccountId,
        senders: [address],
        recipients: [""],
        extra: {
          functionId: EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE,
          transactionType: "public",
          programId: MOCK_TOKEN_PROGRAM_ID,
        },
      });
      const subAccount = getTestTokenAccount({
        operations: [publicOp, privateOp],
        operationsCount: 2,
      });

      const [patched] = patchTokenSubAccountOps([subAccount]);

      expect(patched.operations[0]).toMatchObject({
        recipients: [address],
        extra: expect.objectContaining({ patched: true }),
      });
    });

    it("should leave already patched semi-public ops unchanged", () => {
      const patchedOp = getMockedOperation({
        hash: "tx-semi",
        type: "OUT",
        accountId: tokenAccountId,
        recipients: [""],
        extra: {
          functionId: EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE,
          transactionType: "public",
          programId: MOCK_TOKEN_PROGRAM_ID,
          patched: true,
        },
      });
      const subAccount = getTestTokenAccount({
        operations: [patchedOp],
        operationsCount: 1,
      });

      const [result] = patchTokenSubAccountOps([subAccount]);

      expect(result.operations[0]).toBe(patchedOp);
    });
  });

  describe("attachPrivateTokenOpsToParent", () => {
    it("should create a FEES parent coin op for private token OUT operations", () => {
      const privateOutOp = getMockedOperation({
        hash: "tx-private-out",
        type: "OUT",
        accountId: tokenAccountId,
        senders: [],
        fee: new BigNumber(99),
        extra: {
          functionId: EXPLORER_TRANSFER_TYPES.PRIVATE,
          transactionType: "private",
          programId: MOCK_TOKEN_PROGRAM_ID,
        },
      });
      const privateTokenOpsByAccountId = new Map([[tokenAccountId, [privateOutOp]]]);

      const operations: AleoOperation[] = [];
      attachPrivateTokenOpsToParent({
        operations,
        privateTokenOpsByAccountId,
        ledgerAccountId,
        address,
      });

      expect(operations).toHaveLength(1);
      expect(operations[0]).toMatchObject({
        type: "FEES",
        value: new BigNumber(99),
        senders: [address],
        id: encodeOperationId(ledgerAccountId, "tx-private-out", "FEES"),
      });
      expect(operations[0].subOperations).toEqual([
        expect.objectContaining({ id: privateOutOp.id }),
      ]);
    });

    it("should attach private IN ops to an existing parent coin op with the same hash", () => {
      const parentOp = getMockedOperation({
        hash: "tx-in",
        type: "NONE",
        accountId: ledgerAccountId,
        subOperations: [],
      });
      const privateInOp = getMockedOperation({
        hash: "tx-in",
        type: "IN",
        accountId: tokenAccountId,
        extra: {
          functionId: EXPLORER_TRANSFER_TYPES.PRIVATE,
          transactionType: "private",
          programId: MOCK_TOKEN_PROGRAM_ID,
        },
      });

      const operations = [parentOp];
      attachPrivateTokenOpsToParent({
        operations,
        privateTokenOpsByAccountId: new Map([[tokenAccountId, [privateInOp]]]),
        ledgerAccountId,
        address,
      });

      expect(operations[0].subOperations).toEqual([
        expect.objectContaining({ id: privateInOp.id }),
      ]);
    });
  });

  describe("buildSubAccountsFromPrivateRecords", () => {
    beforeEach(() => {
      mockDecryptRecord.mockResolvedValue({
        owner: "owner.private",
        data: { amount: "300u128" },
        nonce: "nonce",
        version: 1,
      });
      mockGetTransactionById.mockResolvedValue({
        fee_value: 1000,
        execution: { transitions: [] },
      } as never);
    });

    it("should compute private balance from unspent token records", async () => {
      const unspentRecord = getMockedTokenPrivateRecord({
        sender: "aleo1sender",
        record_ciphertext: "cipher-1",
      });
      const calTokens = new Map([[MOCK_TOKEN_PROGRAM_ID, mockTokenCurrency]]);

      const { subAccounts } = await buildSubAccountsFromPrivateRecords({
        currency: mockCurrency,
        ledgerAccountId,
        allPrivateRecords: [],
        unspentPrivateRecords: [unspentRecord],
        baseSubAccounts: [getTestTokenAccount()],
        viewKey: "AViewKey123",
        address,
        calTokens,
      });

      expect(subAccounts).toHaveLength(1);
      expect(subAccounts[0].privateBalance).toEqual(new BigNumber(300));
      expect(subAccounts[0].unspentPrivateRecords).toHaveLength(1);
    });

    it("should build private IN history ops from incoming records", async () => {
      const incomingRecord = getMockedTokenPrivateRecord({
        sender: "aleo1sender",
        transaction_id: "tx-incoming",
        record_ciphertext: "cipher-in",
      });
      const calTokens = new Map([[MOCK_TOKEN_PROGRAM_ID, mockTokenCurrency]]);

      const { subAccounts, privateTokenOpsByAccountId } = await buildSubAccountsFromPrivateRecords({
        currency: mockCurrency,
        ledgerAccountId,
        allPrivateRecords: [incomingRecord],
        unspentPrivateRecords: [],
        baseSubAccounts: [],
        viewKey: "AViewKey123",
        address,
        calTokens,
      });

      expect(privateTokenOpsByAccountId.get(tokenAccountId)).toEqual([
        expect.objectContaining({
          type: "IN",
          hash: "tx-incoming",
          value: new BigNumber(300),
        }),
      ]);
      expect(subAccounts[0].operations).toHaveLength(1);
    });

    it("should merge private fields into existing base sub-accounts", async () => {
      const baseSubAccount = getTestTokenAccount({
        transparentBalance: new BigNumber(1000),
        operations: [
          getMockedOperation({
            hash: "old-public",
            type: "IN",
            accountId: tokenAccountId,
            extra: {
              functionId: "transfer_public",
              transactionType: "public",
              programId: MOCK_TOKEN_PROGRAM_ID,
            },
          }),
        ],
        operationsCount: 1,
      });
      const unspentRecord = getMockedTokenPrivateRecord({
        sender: "aleo1sender",
        record_ciphertext: "cipher-1",
      });
      const calTokens = new Map([[MOCK_TOKEN_PROGRAM_ID, mockTokenCurrency]]);

      const { subAccounts } = await buildSubAccountsFromPrivateRecords({
        currency: mockCurrency,
        ledgerAccountId,
        allPrivateRecords: [],
        unspentPrivateRecords: [unspentRecord],
        baseSubAccounts: [baseSubAccount],
        viewKey: "AViewKey123",
        address,
        calTokens,
      });

      expect(subAccounts[0].balance).toEqual(new BigNumber(1300));
      expect(subAccounts[0].operations).toEqual(
        expect.arrayContaining([expect.objectContaining({ hash: "old-public" })]),
      );
    });
  });

  describe("withPrivateBalance", () => {
    const makeBalanceEntry = (id: string, balance: BigNumber): AleoPrivateTokenBalance => ({
      id,
      contractAddress: mockTokenCurrency.contractAddress,
      balance,
      unspentRecords: [],
    });

    it("should add private balance on top of transparent balance for existing sub-accounts", () => {
      const subAccount = getTestTokenAccount({ transparentBalance: new BigNumber(500) });
      const balanceEntriesById = new Map([
        [subAccount.id, makeBalanceEntry(subAccount.id, new BigNumber(200))],
      ]);

      const result = withPrivateBalance({
        subAccount,
        isExisting: true,
        balanceEntriesById,
        privateTokenOpsByAccountId: new Map(),
      });

      expect(result.transparentBalance).toEqual(new BigNumber(500));
      expect(result.privateBalance).toEqual(new BigNumber(200));
      expect(result.balance).toEqual(new BigNumber(700));
      expect(result.spendableBalance).toEqual(new BigNumber(700));
    });

    it("should use zero transparent balance for new sub-accounts regardless of stored balance", () => {
      const subAccount = getTestTokenAccount({ transparentBalance: new BigNumber(500) });
      const balanceEntriesById = new Map([
        [subAccount.id, makeBalanceEntry(subAccount.id, new BigNumber(300))],
      ]);

      const result = withPrivateBalance({
        subAccount,
        isExisting: false,
        balanceEntriesById,
        privateTokenOpsByAccountId: new Map(),
      });

      expect(result.transparentBalance).toEqual(new BigNumber(0));
      expect(result.privateBalance).toEqual(new BigNumber(300));
      expect(result.balance).toEqual(new BigNumber(300));
    });

    it("should use zero private balance when no balance entry exists", () => {
      const subAccount = getTestTokenAccount({ transparentBalance: new BigNumber(100) });

      const result = withPrivateBalance({
        subAccount,
        isExisting: true,
        balanceEntriesById: new Map(),
        privateTokenOpsByAccountId: new Map(),
      });

      expect(result.privateBalance).toEqual(new BigNumber(0));
      expect(result.balance).toEqual(new BigNumber(100));
    });

    it("should merge existing ops with new private ops for existing sub-accounts", () => {
      const existingOp = getMockedOperation({ id: "op-existing", hash: "existing-op" });
      const subAccount = getTestTokenAccount({ operations: [existingOp] });
      const privateOp = getMockedOperation({ id: "op-private", hash: "private-op" });
      const privateTokenOpsByAccountId = new Map([[subAccount.id, [privateOp]]]);

      const result = withPrivateBalance({
        subAccount,
        isExisting: true,
        balanceEntriesById: new Map(),
        privateTokenOpsByAccountId,
      });

      expect(result.operations).toHaveLength(2);
      expect(result.operations.map(op => op.hash)).toEqual(
        expect.arrayContaining(["existing-op", "private-op"]),
      );
      expect(result.operationsCount).toBe(2);
    });

    it("should use only private ops for new sub-accounts even when ops exist on the passed account", () => {
      const existingOp = getMockedOperation({ hash: "existing-op" });
      const subAccount = getTestTokenAccount({ operations: [existingOp] });
      const privateOp = getMockedOperation({ hash: "private-op" });
      const privateTokenOpsByAccountId = new Map([[subAccount.id, [privateOp]]]);

      const result = withPrivateBalance({
        subAccount,
        isExisting: false,
        balanceEntriesById: new Map(),
        privateTokenOpsByAccountId,
      });

      expect(result.operations).toHaveLength(1);
      expect(result.operations[0].hash).toBe("private-op");
      expect(result.operationsCount).toBe(1);
    });

    it("should pass through unspentRecords from the balance entry", () => {
      const subAccount = getTestTokenAccount();
      const entry: AleoPrivateTokenBalance = {
        id: subAccount.id,
        contractAddress: mockTokenCurrency.contractAddress,
        balance: new BigNumber(100),
        unspentRecords: [mockUnspentTokenRecord1],
      };
      const balanceEntriesById = new Map([[subAccount.id, entry]]);

      const result = withPrivateBalance({
        subAccount,
        isExisting: true,
        balanceEntriesById,
        privateTokenOpsByAccountId: new Map(),
      });

      expect(result.unspentPrivateRecords).toHaveLength(1);
      expect(result.unspentPrivateRecords?.[0]).toBe(mockUnspentTokenRecord1);
    });
  });
});
