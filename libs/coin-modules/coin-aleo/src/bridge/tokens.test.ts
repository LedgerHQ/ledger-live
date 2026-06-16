import BigNumber from "bignumber.js";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { apiClient } from "../network/api";
import { getMockedAccount, getMockedTokenAccount } from "../__tests__/fixtures/account.fixture";
import {
  getMockedCurrency,
  getMockedTokenCurrency,
  MOCK_TOKEN_PROGRAM_ID,
} from "../__tests__/fixtures/currency.fixture";
import { getMockedOperation } from "../__tests__/fixtures/operation.fixture";
import type { AleoOperation } from "../types";
import {
  applyTransparentBalance,
  getAleoSubAccounts,
  mergeSubAccounts,
  prepareTokenOperations,
  resolveTokenSubAccounts,
} from "./tokens";

jest.mock("../network/api");

const mockGetTokenBalance = jest.mocked(apiClient.getTokenBalance);

const mockCurrency = getMockedCurrency();
const mockTokenCurrency = getMockedTokenCurrency();
const mockAccount = getMockedAccount();
const ledgerAccountId = mockAccount.id;
const address = mockAccount.freshAddress;
const tokenAccountId = encodeTokenAccountId(ledgerAccountId, mockTokenCurrency);

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

  describe("getAleoSubAccounts", () => {
    it("should fetch transparent balances and build token sub-accounts", async () => {
      const calTokens = new Map([[MOCK_TOKEN_PROGRAM_ID, mockTokenCurrency]]);
      const tokenOp = getMockedTokenOperation();

      const result = await getAleoSubAccounts({
        currency: mockCurrency,
        ledgerAccountId,
        address,
        tokenOperations: [tokenOp],
        calTokens,
      });

      expect(mockGetTokenBalance).toHaveBeenCalledWith(
        mockCurrency,
        MOCK_TOKEN_PROGRAM_ID,
        address,
      );
      expect(result).toEqual([
        expect.objectContaining({
          id: tokenAccountId,
          parentId: ledgerAccountId,
          token: mockTokenCurrency,
          balance: new BigNumber(250000),
        }),
      ]);
    });

    it("should return an empty array when there are no token operations", async () => {
      const result = await getAleoSubAccounts({
        currency: mockCurrency,
        ledgerAccountId,
        address,
        tokenOperations: [],
        calTokens: new Map([[MOCK_TOKEN_PROGRAM_ID, mockTokenCurrency]]),
      });

      expect(result).toEqual([]);
      expect(mockGetTokenBalance).not.toHaveBeenCalled();
    });
  });

  describe("mergeSubAccounts", () => {
    it("should return new sub-accounts when there is no initial account", () => {
      const newSubAccount = getMockedTokenAccount();

      expect(mergeSubAccounts(undefined, [newSubAccount])).toEqual([newSubAccount]);
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
      const existingSubAccount = getMockedTokenAccount(mockTokenCurrency, {
        operations: [existingOp],
        operationsCount: 1,
      });
      const incomingSubAccount = getMockedTokenAccount(mockTokenCurrency, {
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
      const subAccount = getMockedTokenAccount(mockTokenCurrency, {
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
      const subAccount = getMockedTokenAccount(mockTokenCurrency, {
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
      expect(subAccounts[0].operations[0]).toMatchObject({
        type: "IN",
        accountId: tokenAccountId,
      });
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
});
