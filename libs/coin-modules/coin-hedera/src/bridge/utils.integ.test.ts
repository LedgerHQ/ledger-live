import BigNumber from "bignumber.js";
import { encodeTokenAccountId } from "@ledgerhq/coin-framework/account";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { HEDERA_OPERATION_TYPES, HEDERA_TRANSACTION_MODES } from "../constants";
import { estimateFees } from "../logic/estimateFees";
import { getMockedAccount, getMockedTokenAccount } from "../test/fixtures/account.fixture";
import {
  getMockedHTSTokenCurrency,
  getTokenCurrencyFromCAL,
  getTokenCurrencyFromCALByType,
} from "../test/fixtures/currency.fixture";
import { getMockedMirrorToken } from "../test/fixtures/mirror.fixture";
import { getMockedOperation } from "../test/fixtures/operation.fixture";
import { getMockedTransaction } from "../test/fixtures/transaction.fixture";
import type { EstimateFeesResult } from "../types";
import { calculateAmount, getSubAccounts } from "./utils";

describe("utils", () => {
  beforeAll(() => {
    // Setup CAL client store (automatically set as global store)
    setupCalClientStore();
  });

  describe("calculateAmount", () => {
    let estimatedFees: Record<"crypto" | "associate", EstimateFeesResult>;

    beforeAll(async () => {
      const mockedAccount = getMockedAccount();
      const [crypto, associate] = await Promise.all([
        estimateFees({
          currency: mockedAccount.currency,
          operationType: HEDERA_OPERATION_TYPES.CryptoTransfer,
        }),
        estimateFees({
          currency: mockedAccount.currency,
          operationType: HEDERA_OPERATION_TYPES.TokenAssociate,
        }),
      ]);

      estimatedFees = { crypto, associate };
    });

    it("HBAR transfer, useAllAmount = true", async () => {
      const mockedAccount = getMockedAccount();
      const mockedTransaction = getMockedTransaction({ useAllAmount: true });

      const amount = mockedAccount.balance.minus(estimatedFees.crypto.tinybars);
      const totalSpent = amount.plus(estimatedFees.crypto.tinybars);

      const result = await calculateAmount({
        account: mockedAccount,
        transaction: mockedTransaction,
      });

      expect(result).toEqual({ amount, totalSpent });
    });

    it("HBAR transfer, useAllAmount = false", async () => {
      const mockedAccount = getMockedAccount();
      const mockedTransaction = getMockedTransaction({
        useAllAmount: false,
        amount: new BigNumber(1000000),
      });

      const amount = mockedTransaction.amount;
      const totalSpent = amount.plus(estimatedFees.crypto.tinybars);

      const result = await calculateAmount({
        account: mockedAccount,
        transaction: mockedTransaction,
      });

      expect(result).toEqual({ amount, totalSpent });
    });

    it("token transfer, useAllAmount = true", async () => {
      const mockedTokenCurrency = getMockedHTSTokenCurrency();
      const mockedTokenAccount = getMockedTokenAccount(mockedTokenCurrency);
      const mockedAccount = getMockedAccount({ subAccounts: [mockedTokenAccount] });
      const mockedTransaction = getMockedTransaction({
        useAllAmount: true,
        subAccountId: mockedTokenAccount.id,
      });

      const amount = mockedTokenAccount.balance;
      const totalSpent = amount;

      const result = await calculateAmount({
        account: mockedAccount,
        transaction: mockedTransaction,
      });

      expect(result).toEqual({ amount, totalSpent });
    });

    it("token transfer, useAllAmount = false", async () => {
      const mockedTokenCurrency = getMockedHTSTokenCurrency();
      const mockedTokenAccount = getMockedTokenAccount(mockedTokenCurrency);
      const mockedAccount = getMockedAccount({ subAccounts: [mockedTokenAccount] });
      const mockedTransaction = getMockedTransaction({
        useAllAmount: false,
        amount: new BigNumber(1),
        subAccountId: mockedTokenAccount.id,
      });

      const amount = mockedTransaction.amount;
      const totalSpent = amount;

      const result = await calculateAmount({
        account: mockedAccount,
        transaction: mockedTransaction,
      });

      expect(result).toEqual({ amount, totalSpent });
    });

    it("token associate operation uses TokenAssociate fee", async () => {
      const mockedTokenCurrency = getMockedHTSTokenCurrency();
      const mockedTokenAccount = getMockedTokenAccount(mockedTokenCurrency);
      const mockedAccount = getMockedAccount({ subAccounts: [mockedTokenAccount] });
      const mockedTransaction = getMockedTransaction({
        useAllAmount: false,
        amount: new BigNumber(1),
        mode: HEDERA_TRANSACTION_MODES.TokenAssociate,
        properties: {
          token: mockedTokenCurrency,
        },
      });

      const amount = mockedTransaction.amount;
      const totalSpent = amount.plus(estimatedFees.associate.tinybars);

      const result = await calculateAmount({
        account: mockedAccount,
        transaction: mockedTransaction,
      });

      expect(result).toEqual({ amount, totalSpent });
    });
  });

  describe("getSubAccounts", () => {
    it("returns sub account based on operations and mirror tokens", async () => {
      const firstTokenCurrencyFromCAL = getTokenCurrencyFromCAL(0);
      const secondTokenCurrencyFromCAL = getTokenCurrencyFromCAL(1);
      const mockedAccount = getMockedAccount();
      const mockedMirrorToken1 = getMockedMirrorToken({
        token_id: firstTokenCurrencyFromCAL.contractAddress,
        balance: 10,
      });
      const mockedMirrorToken2 = getMockedMirrorToken({
        token_id: secondTokenCurrencyFromCAL.contractAddress,
        balance: 0,
      });

      // Fetch actual tokens from CAL to get the real format
      const firstTokenFromCAL = await getCryptoAssetsStore().findTokenByAddressInCurrency(
        firstTokenCurrencyFromCAL.contractAddress,
        "hedera",
      );
      const secondTokenFromCAL = await getCryptoAssetsStore().findTokenByAddressInCurrency(
        secondTokenCurrencyFromCAL.contractAddress,
        "hedera",
      );

      if (!firstTokenFromCAL || !secondTokenFromCAL) {
        throw new Error("Tokens not found in CAL");
      }

      const mockedOperation1 = getMockedOperation({
        accountId: encodeTokenAccountId(mockedAccount.id, firstTokenFromCAL),
      });
      const mockedOperation2 = getMockedOperation({
        accountId: encodeTokenAccountId(mockedAccount.id, secondTokenFromCAL),
      });

      const result = await getSubAccounts({
        ledgerAccountId: mockedAccount.id,
        latestTokenOperations: [mockedOperation1, mockedOperation2],
        mirrorTokens: [mockedMirrorToken1, mockedMirrorToken2],
        erc20Tokens: [],
      });
      const uniqueSubAccountIds = new Set(result.map(sa => sa.id));

      expect(uniqueSubAccountIds.size).toBe(result.length);
      expect(result).toHaveLength(2);
      expect(result).toMatchObject([
        {
          token: firstTokenCurrencyFromCAL,
          balance: new BigNumber(10),
          operations: [mockedOperation1],
        },
        {
          token: secondTokenCurrencyFromCAL,
          balance: new BigNumber(0),
          operations: [mockedOperation2],
        },
      ]);
    });

    it("ignores operation if token is not listed in CAL", async () => {
      const mockedTokenCurrency = getMockedHTSTokenCurrency();
      const mockedAccount = getMockedAccount();
      const mockedOperation = getMockedOperation({
        accountId: encodeTokenAccountId(mockedAccount.id, mockedTokenCurrency),
      });

      const result = await getSubAccounts({
        ledgerAccountId: mockedAccount.id,
        latestTokenOperations: [mockedOperation],
        mirrorTokens: [],
        erc20Tokens: [],
      });

      expect(result).toEqual([]);
    });

    it("returns sub account for mirror token with no operations yet (e.g. right after association)", async () => {
      const tokenCurrencyFromCAL = getTokenCurrencyFromCAL(0);
      const mockedAccount = getMockedAccount();
      const mockedTokenHTS = getMockedMirrorToken({
        token_id: tokenCurrencyFromCAL.contractAddress,
        balance: 42,
      });

      const result = await getSubAccounts({
        ledgerAccountId: mockedAccount.id,
        latestTokenOperations: [],
        mirrorTokens: [mockedTokenHTS],
        erc20Tokens: [],
      });

      expect(result).toMatchObject([
        {
          token: tokenCurrencyFromCAL,
          operations: [],
          balance: new BigNumber(42),
        },
      ]);
    });

    it("returns sub account for erc20 token with no operations yet", async () => {
      const tokenCurrencyFromCAL = getTokenCurrencyFromCALByType("erc20");
      const mockedAccount = getMockedAccount();

      const result = await getSubAccounts({
        ledgerAccountId: mockedAccount.id,
        latestTokenOperations: [],
        mirrorTokens: [],
        erc20Tokens: [{ balance: new BigNumber(42), token: tokenCurrencyFromCAL }],
      });

      expect(result).toMatchObject([
        {
          token: tokenCurrencyFromCAL,
          operations: [],
          balance: new BigNumber(42),
        },
      ]);
    });
  });
});
