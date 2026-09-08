import {
  AmountRequired,
  FeeRequired,
  FeeTooHigh,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import BigNumber from "bignumber.js";
import { MAX_MEMO_LENGTH, PLT_MAX_MEMO_SIZE } from "@ledgerhq/concordium-core";
import {
  createFixtureAccount,
  createFixtureTokenAccount,
  createFixtureTokenCurrency,
  createFixtureTransaction,
  setupTestnetCoinConfig,
  VALID_ADDRESS,
  VALID_ADDRESS_2,
} from "../test/fixtures";
import {
  ConcordiumInsufficientCcdForFee,
  ConcordiumInsufficientFunds,
  ConcordiumInvalidPltPayloadError,
  ConcordiumMemoTooLong,
  ConcordiumTokenAccountUnavailable,
  ConcordiumTokenPaused,
  ConcordiumTokenRestrictionsUnverified,
  ConcordiumTokenTransferNotPermitted,
  ConcordiumUnsupportedTokenDecimals,
} from "../types/errors";
import type { ConcordiumAccount, ConcordiumTokenResources } from "../types";
import { getTransactionStatus } from "./getTransactionStatus";

const PLT_ID = "t-USDT";

/**
 * A parent holding one PLT sub-account, with the per-token state on the parent
 * where sync puts it — `TokenAccount` is closed and has no family slot.
 */
const withToken = ({
  tokenState = { transferStatus: "allowed" } as ConcordiumTokenResources,
  magnitude = 6,
  balance = new BigNumber(5000000),
  ccdBalance,
  ccdSpendable,
}: {
  tokenState?: ConcordiumTokenResources | null;
  magnitude?: number;
  balance?: BigNumber;
  ccdBalance?: BigNumber;
  ccdSpendable?: BigNumber;
} = {}) => {
  const parent = createFixtureAccount();
  const token = createFixtureTokenCurrency({
    units: magnitude === -1 ? [] : [{ name: PLT_ID, code: PLT_ID, magnitude }],
  });
  const subAccount = createFixtureTokenAccount({
    parentId: parent.id,
    token,
    balance,
    spendableBalance: balance,
  });

  const account = {
    ...parent,
    ...(ccdBalance ? { balance: ccdBalance } : {}),
    ...(ccdSpendable ? { spendableBalance: ccdSpendable } : {}),
    subAccounts: [subAccount],
    concordiumResources: {
      ...(parent as ConcordiumAccount).concordiumResources,
      ...(tokenState ? { tokens: { [PLT_ID]: tokenState } } : {}),
    },
  } as ConcordiumAccount;

  return { account, subAccount };
};

const tokenTx = (subAccountId: string, over = {}) =>
  createFixtureTransaction({
    subAccountId,
    recipient: VALID_ADDRESS_2,
    amount: new BigNumber(1000000),
    fee: new BigNumber(3600),
    ...over,
  });

describe("getTransactionStatus", () => {
  beforeEach(() => {
    setupTestnetCoinConfig({ minReserve: 0, currency: createFixtureAccount().currency });
  });

  describe("fee validation", () => {
    it("should return FeeRequired error when fee is undefined (becomes zero)", async () => {
      // GIVEN
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({ fee: undefined });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.errors.fee).toBeInstanceOf(FeeRequired);
    });

    it("should return FeeRequired error when fee is zero", async () => {
      // GIVEN
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({ fee: new BigNumber(0) });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.errors.fee).toBeInstanceOf(FeeRequired);
    });

    it("should return FeeTooHigh warning when fee exceeds 10x the amount", async () => {
      // GIVEN - fee (1100) * 10 = 11000 > amount (100)
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({
        amount: new BigNumber(100),
        fee: new BigNumber(1100),
        recipient: VALID_ADDRESS_2,
      });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.warnings.feeTooHigh).toBeInstanceOf(FeeTooHigh);
    });

    it("should not warn about fee when fee is exactly 1/10th of the amount", async () => {
      // GIVEN - fee (100) * 10 = 1000 = amount (1000), so NOT greater
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({
        amount: new BigNumber(1000),
        fee: new BigNumber(100),
        recipient: VALID_ADDRESS_2,
      });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.warnings.feeTooHigh).toBeUndefined();
    });

    it("should not warn about fee when amount is zero", async () => {
      // GIVEN
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({
        amount: new BigNumber(0),
        fee: new BigNumber(1000),
        recipient: VALID_ADDRESS_2,
      });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.warnings.feeTooHigh).toBeUndefined();
    });
  });

  describe("balance validation", () => {
    it("should return ConcordiumInsufficientFunds when totalSpent exceeds balance", async () => {
      // GIVEN - totalSpent (600000) > balance (500000) - reserve (0)
      const account = createFixtureAccount({ balance: new BigNumber(500000) });
      const transaction = createFixtureTransaction({
        amount: new BigNumber(500000),
        fee: new BigNumber(100000),
        recipient: VALID_ADDRESS_2,
      });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.errors.amount).toBeInstanceOf(ConcordiumInsufficientFunds);
    });

    it("should return ConcordiumInsufficientFunds when totalSpent exceeds balance minus reserve but not balance", async () => {
      // GIVEN - balance (500000) >= totalSpent (500000) > balance (500000) - reserve (100000) = 400000
      setupTestnetCoinConfig({ minReserve: 100000, currency: createFixtureAccount().currency });
      const account = createFixtureAccount({ balance: new BigNumber(500000) });
      const transaction = createFixtureTransaction({
        amount: new BigNumber(400000),
        fee: new BigNumber(100000),
        recipient: VALID_ADDRESS_2,
      });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.errors.amount).toBeInstanceOf(ConcordiumInsufficientFunds);
    });

    it("should not error when amount is below reserve but totalSpent is within limits", async () => {
      // GIVEN - amount (50000) < reserve (100000), but totalSpent (51000) < balance (1000000) - reserve (100000)
      setupTestnetCoinConfig({ minReserve: 100000, currency: createFixtureAccount().currency });
      const account = createFixtureAccount({ balance: new BigNumber(1000000) });
      const transaction = createFixtureTransaction({
        amount: new BigNumber(50000),
        fee: new BigNumber(1000),
        recipient: VALID_ADDRESS_2,
      });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.errors.amount).toBeUndefined();
    });

    it("should not error when amount equals reserve", async () => {
      // GIVEN
      setupTestnetCoinConfig({ minReserve: 100000, currency: createFixtureAccount().currency });
      const account = createFixtureAccount({ balance: new BigNumber(1000000) });
      const transaction = createFixtureTransaction({
        amount: new BigNumber(100000),
        fee: new BigNumber(1000),
        recipient: VALID_ADDRESS_2,
      });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.errors.amount).toBeUndefined();
    });
  });

  describe("recipient validation", () => {
    it("should return RecipientRequired error when recipient is empty", async () => {
      // GIVEN
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({ recipient: "" });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
    });

    it("should return InvalidAddressBecauseDestinationIsAlsoSource when recipient equals sender", async () => {
      // GIVEN
      const account = createFixtureAccount({ freshAddress: VALID_ADDRESS });
      const transaction = createFixtureTransaction({ recipient: VALID_ADDRESS });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
    });

    it("should return InvalidAddress error for invalid address format", async () => {
      // GIVEN
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({ recipient: "not-a-valid-address" });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
    });

    it("should accept valid recipient address", async () => {
      // GIVEN
      const account = createFixtureAccount({ freshAddress: VALID_ADDRESS });
      const transaction = createFixtureTransaction({ recipient: VALID_ADDRESS_2 });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.errors.recipient).toBeUndefined();
    });
  });

  describe("amount validation", () => {
    it("should return AmountRequired error when amount is zero", async () => {
      // GIVEN
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({
        amount: new BigNumber(0),
        recipient: VALID_ADDRESS_2,
      });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.errors.amount).toBeInstanceOf(AmountRequired);
    });

    it("should not return AmountRequired when useAllAmount is true even with zero calculated amount", async () => {
      // GIVEN
      const account = createFixtureAccount({ spendableBalance: new BigNumber(1000) });
      const transaction = createFixtureTransaction({
        amount: new BigNumber(0),
        fee: new BigNumber(1000),
        useAllAmount: true,
        recipient: VALID_ADDRESS_2,
      });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.errors.amount).not.toBeInstanceOf(AmountRequired);
    });
  });

  describe("useAllAmount calculation", () => {
    it("should calculate amount as spendableBalance minus fee when useAllAmount is true", async () => {
      // GIVEN
      const account = createFixtureAccount({ spendableBalance: new BigNumber(100000) });
      const transaction = createFixtureTransaction({
        amount: new BigNumber(0),
        fee: new BigNumber(1000),
        useAllAmount: true,
        recipient: VALID_ADDRESS_2,
      });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.amount).toEqual(new BigNumber(99000));
      expect(result.totalSpent).toEqual(new BigNumber(100000));
    });

    it("should use transaction amount when useAllAmount is false", async () => {
      // GIVEN
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({
        amount: new BigNumber(50000),
        fee: new BigNumber(1000),
        useAllAmount: false,
        recipient: VALID_ADDRESS_2,
      });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.amount).toEqual(new BigNumber(50000));
      expect(result.totalSpent).toEqual(new BigNumber(51000));
    });

    it("should return zero amount when fee exceeds spendableBalance with useAllAmount", async () => {
      // GIVEN
      const account = createFixtureAccount({ spendableBalance: new BigNumber(500) });
      const transaction = createFixtureTransaction({
        fee: new BigNumber(1000),
        useAllAmount: true,
        recipient: VALID_ADDRESS_2,
      });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.amount).toEqual(new BigNumber(0));
    });
  });

  describe("return values", () => {
    it("should return correct estimatedFees", async () => {
      // GIVEN
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({
        fee: new BigNumber(5000),
        recipient: VALID_ADDRESS_2,
      });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.estimatedFees).toEqual(new BigNumber(5000));
    });

    it("should return zero estimatedFees when fee is undefined", async () => {
      // GIVEN
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({ fee: undefined });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.estimatedFees).toEqual(new BigNumber(0));
    });
  });

  describe("memo validation", () => {
    it.each([
      ["undefined", undefined],
      ["empty string", ""],
      ["simple text", "Payment for invoice"],
      ["unicode characters", "Hello 世界 🌍"],
    ])("should accept %s memo", async (_description, memo) => {
      // GIVEN
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({ memo, recipient: VALID_ADDRESS_2 });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.errors.memo).toBeUndefined();
    });

    it.each([
      ["ASCII at limit", "a".repeat(MAX_MEMO_LENGTH), 254],
      ["multi-byte at limit", "🌍".repeat(63) + "12", 254],
    ])("should accept %s (%d bytes)", async (_description, memo, expectedBytes) => {
      // GIVEN
      expect(Buffer.from(memo, "utf-8").length).toBe(expectedBytes);
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({ memo, recipient: VALID_ADDRESS_2 });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.errors.memo).toBeUndefined();
    });

    it.each([
      ["ASCII over limit", "a".repeat(MAX_MEMO_LENGTH + 1), 255],
      ["multi-byte over limit", "🌍".repeat(64), 256],
    ])("should reject %s (%d bytes)", async (_description, memo, expectedBytes) => {
      // GIVEN
      expect(Buffer.from(memo, "utf-8").length).toBe(expectedBytes);
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({ memo, recipient: VALID_ADDRESS_2 });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.errors.memo).toBeInstanceOf(ConcordiumMemoTooLong);
    });
  });

  describe("PLT transfers", () => {
    it("compares the amount against the token balance, not the CCD balance", async () => {
      const { account, subAccount } = withToken({ balance: new BigNumber(1000) });

      const status = await getTransactionStatus(
        account,
        tokenTx(subAccount.id, { amount: new BigNumber(2000) }),
      );

      expect(status.errors.amount).toBeInstanceOf(ConcordiumInsufficientFunds);
    });

    it("accepts an amount the CCD balance could never cover", async () => {
      const { account, subAccount } = withToken({ balance: new BigNumber("999999999999") });

      const status = await getTransactionStatus(
        account,
        tokenTx(subAccount.id, { amount: new BigNumber("999999999999") }),
      );

      expect(status.errors).toEqual({});
    });

    // The token balance is untouched here; only the CCD balance is short.
    it("reports a distinct error when CCD cannot cover the fee", async () => {
      const { account, subAccount } = withToken({ ccdBalance: new BigNumber(100) });

      const status = await getTransactionStatus(account, tokenTx(subAccount.id));

      expect(status.errors.amount).toBeInstanceOf(ConcordiumInsufficientCcdForFee);
    });

    // A staked account: 10 CCD held, 1000 µCCD at its disposal. `minReserve` is 0
    // on both networks, so a balance-based check would wave this through.
    it("gates the fee on what is at the account's disposal, not its balance", async () => {
      const { account, subAccount } = withToken({
        ccdBalance: new BigNumber(10000000),
        ccdSpendable: new BigNumber(1000),
      });

      const status = await getTransactionStatus(
        account,
        tokenTx(subAccount.id, { fee: new BigNumber(3600) }),
      );

      expect(status.errors.amount).toBeInstanceOf(ConcordiumInsufficientCcdForFee);
    });

    it("accepts a fee the disposable balance covers", async () => {
      const { account, subAccount } = withToken({
        ccdBalance: new BigNumber(10000000),
        ccdSpendable: new BigNumber(50000),
      });

      const status = await getTransactionStatus(
        account,
        tokenTx(subAccount.id, { fee: new BigNumber(3600) }),
      );

      expect(status.errors).toEqual({});
    });

    it("keeps the fee out of totalSpent, which is the token amount alone", async () => {
      const { account, subAccount } = withToken();

      const status = await getTransactionStatus(
        account,
        tokenTx(subAccount.id, { amount: new BigNumber(1000000) }),
      );

      expect(status.totalSpent).toEqual(new BigNumber(1000000));
      expect(status.estimatedFees).toEqual(new BigNumber(3600));
    });

    it("sends the whole token balance on useAllAmount, unreduced by the fee", async () => {
      const { account, subAccount } = withToken({ balance: new BigNumber(777) });

      const status = await getTransactionStatus(
        account,
        tokenTx(subAccount.id, { useAllAmount: true, amount: new BigNumber(0) }),
      );

      expect(status.amount).toEqual(new BigNumber(777));
      expect(status.errors).toEqual({});
    });

    // A paused token's verdict is also `"blocked"`, so order decides this one.
    it("reports a paused token as paused, not as a list rejection", async () => {
      const { account, subAccount } = withToken({
        tokenState: { transferStatus: "blocked", paused: true },
      });

      const status = await getTransactionStatus(account, tokenTx(subAccount.id));

      expect(status.errors.sender).toBeInstanceOf(ConcordiumTokenPaused);
    });

    it("blocks a rejected sender without naming which list refused them", async () => {
      const { account, subAccount } = withToken({ tokenState: { transferStatus: "blocked" } });

      const status = await getTransactionStatus(account, tokenTx(subAccount.id));

      expect(status.errors.sender).toBeInstanceOf(ConcordiumTokenTransferNotPermitted);
    });

    it("distinguishes an unreadable policy from a rejection", async () => {
      const { account, subAccount } = withToken({ tokenState: { transferStatus: "unknown" } });

      const status = await getTransactionStatus(account, tokenTx(subAccount.id));

      expect(status.errors.sender).toBeInstanceOf(ConcordiumTokenRestrictionsUnverified);
      expect(status.errors.sender).not.toBeInstanceOf(ConcordiumTokenTransferNotPermitted);
    });

    it("blocks when sync recorded no state for the token at all", async () => {
      const { account, subAccount } = withToken({ tokenState: null });

      const status = await getTransactionStatus(account, tokenTx(subAccount.id));

      expect(status.errors.sender).toBeInstanceOf(ConcordiumTokenRestrictionsUnverified);
    });

    // A corrupted store or a newer app version can produce this.
    it("blocks an off-union transferStatus", async () => {
      const { account, subAccount } = withToken({
        tokenState: { transferStatus: "something-newer" } as unknown as ConcordiumTokenResources,
      });

      const status = await getTransactionStatus(account, tokenTx(subAccount.id));

      expect(status.errors.sender).toBeInstanceOf(ConcordiumTokenTransferNotPermitted);
    });

    it("rejects a token declaring more decimals than the device signs", async () => {
      const { account, subAccount } = withToken({ magnitude: 19 });

      const status = await getTransactionStatus(account, tokenTx(subAccount.id));

      expect(status.errors.amount).toBeInstanceOf(ConcordiumUnsupportedTokenDecimals);
    });

    it("accepts exactly 18 decimals", async () => {
      const { account, subAccount } = withToken({ magnitude: 18 });

      const status = await getTransactionStatus(account, tokenTx(subAccount.id));

      expect(status.errors).toEqual({});
    });

    // Reported as a payload defect, not as unsupported decimals: that message
    // interpolates the count, and there is none to interpolate.
    it("rejects a token whose magnitude is missing", async () => {
      const { account, subAccount } = withToken({ magnitude: -1 });

      const status = await getTransactionStatus(account, tokenTx(subAccount.id));

      expect(status.errors.amount).toBeInstanceOf(ConcordiumInvalidPltPayloadError);
    });

    // The message renders `{{decimals}}`, so a non-numeric value would reach the
    // user as "The token uses undefined decimal places".
    it("carries a real number in the decimals message", async () => {
      const { account, subAccount } = withToken({ magnitude: 19 });

      const status = await getTransactionStatus(account, tokenTx(subAccount.id));

      expect(status.errors.amount).toMatchObject({ decimals: "19", maxDecimals: "18" });
    });

    it("rejects an out-of-range token id as a payload defect", async () => {
      const parent = createFixtureAccount();
      const token = createFixtureTokenCurrency({ contractAddress: "x".repeat(129) });
      const subAccount = createFixtureTokenAccount({ parentId: parent.id, token });
      const account = {
        ...parent,
        subAccounts: [subAccount],
        concordiumResources: {
          ...(parent as ConcordiumAccount).concordiumResources,
          tokens: { ["x".repeat(129)]: { transferStatus: "allowed" } },
        },
      } as ConcordiumAccount;

      const status = await getTransactionStatus(account, tokenTx(subAccount.id));

      expect(status.errors.amount).toBeInstanceOf(ConcordiumInvalidPltPayloadError);
    });

    it("rejects a memo past the chain's limit", async () => {
      const { account, subAccount } = withToken();
      const memo = "x".repeat(PLT_MAX_MEMO_SIZE + 1);

      const status = await getTransactionStatus(account, tokenTx(subAccount.id, { memo }));

      expect(status.errors.memo).toBeInstanceOf(ConcordiumMemoTooLong);
    });

    it("accepts a memo at exactly the limit", async () => {
      const { account, subAccount } = withToken();

      const status = await getTransactionStatus(
        account,
        tokenTx(subAccount.id, { memo: "x".repeat(PLT_MAX_MEMO_SIZE) }),
      );

      expect(status.errors).toEqual({});
    });

    // 64 bytes: past what the device renders, well inside what it signs.
    it("accepts a memo longer than the device displays", async () => {
      const { account, subAccount } = withToken();

      const status = await getTransactionStatus(
        account,
        tokenTx(subAccount.id, { memo: "x".repeat(64) }),
      );

      expect(status.errors).toEqual({});
    });

    it("counts memo bytes, not characters", async () => {
      const { account, subAccount } = withToken();
      // 86 characters, 258 bytes.
      const memo = "€".repeat(86);

      const status = await getTransactionStatus(account, tokenTx(subAccount.id, { memo }));

      expect(status.errors.memo).toBeInstanceOf(ConcordiumMemoTooLong);
      expect(memo.length).toBeLessThanOrEqual(PLT_MAX_MEMO_SIZE);
    });

    // The second assertion is the point: one problem, one field.
    it("reports an over-long memo only on the memo field", async () => {
      const { account, subAccount } = withToken();

      const status = await getTransactionStatus(
        account,
        tokenTx(subAccount.id, { memo: "x".repeat(PLT_MAX_MEMO_SIZE + 1) }),
      );

      expect(status.errors.memo).toBeInstanceOf(ConcordiumMemoTooLong);
      expect(status.errors.amount).toBeUndefined();
    });

    // 254 against 256 — close enough to conflate, and different limits on
    // different transaction types.
    it("does not use the CCD memo limit", async () => {
      expect(PLT_MAX_MEMO_SIZE).not.toBe(MAX_MEMO_LENGTH);
    });

    it("still validates the recipient", async () => {
      const { account, subAccount } = withToken();

      const status = await getTransactionStatus(
        account,
        tokenTx(subAccount.id, { recipient: "not-an-address" }),
      );

      expect(status.errors.recipient).toBeInstanceOf(InvalidAddress);
    });

    it("reports a missing fee, as the native path does", async () => {
      const { account, subAccount } = withToken();

      const status = await getTransactionStatus(account, tokenTx(subAccount.id, { fee: null }));

      expect(status.errors.fee).toBeInstanceOf(FeeRequired);
    });

    it("requires a non-zero amount", async () => {
      const { account, subAccount } = withToken();

      const status = await getTransactionStatus(
        account,
        tokenTx(subAccount.id, { amount: new BigNumber(0) }),
      );

      expect(status.errors.amount).toBeInstanceOf(AmountRequired);
    });

    // The amount is deliberately one the parent's CCD balance could cover, so a
    // fall-through would pass validation rather than fail it.
    it("blocks a subAccountId that no longer resolves", async () => {
      const { account, subAccount } = withToken();
      const withoutTokens = { ...account, subAccounts: [] };

      const status = await getTransactionStatus(
        withoutTokens,
        tokenTx(subAccount.id, { amount: new BigNumber(1000) }),
      );

      expect(status.errors.amount).toBeInstanceOf(ConcordiumTokenAccountUnavailable);
    });

    it("leaves a plain CCD transfer alone", async () => {
      const { account } = withToken();

      const status = await getTransactionStatus(
        account,
        createFixtureTransaction({
          recipient: VALID_ADDRESS_2,
          amount: new BigNumber(1000),
          fee: new BigNumber(500),
        }),
      );

      expect(status.errors).toEqual({});
    });

    // The parent's CCD balance is irrelevant to the token amount, so the
    // native fee-vs-amount ratio warning must not fire on a token send.
    it("does not warn that the fee is high relative to a token amount", async () => {
      const { account, subAccount } = withToken();

      const status = await getTransactionStatus(
        account,
        tokenTx(subAccount.id, { amount: new BigNumber(1) }),
      );

      expect(status.warnings).toEqual({});
    });
  });
});
