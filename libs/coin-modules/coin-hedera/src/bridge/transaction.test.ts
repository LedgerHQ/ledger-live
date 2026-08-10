import BigNumber from "bignumber.js";
import { HEDERA_TRANSACTION_MODES } from "../constants";
import { getMockedAccount } from "../test/fixtures/account.fixture";
import { getMockedHTSTokenCurrency } from "../test/fixtures/currency.fixture";
import {
  getMockedTransaction,
  getMockedTransactionRaw,
} from "../test/fixtures/transaction.fixture";
import type { Transaction, TransactionRaw } from "../types";
import { formatTransaction, fromTransactionRaw, toTransactionRaw } from "../transaction";

describe("transaction", () => {
  const mockedAccount = getMockedAccount();
  const mockedTransaction = getMockedTransaction({
    amount: new BigNumber(100000000),
    recipient: "0.0.3",
  });
  const mockedTransactionRaw = getMockedTransactionRaw({
    amount: "100000000",
    recipient: "0.0.3",
  });

  it("formatTransaction", () => {
    const result = formatTransaction(mockedTransaction, mockedAccount);
    const nonBreakingSpace = String.fromCharCode(160);
    const string = `SEND 1${nonBreakingSpace}HBAR\nTO 0.0.3`;

    expect(result).toEqual(string);
  });

  it("fromTransactionRaw", () => {
    const result = fromTransactionRaw(mockedTransactionRaw);
    const data = mockedTransaction;

    expect(result).toEqual(data);
  });

  it("toTransactionRaw", () => {
    const result = toTransactionRaw(mockedTransaction);
    const data = mockedTransactionRaw;

    expect(result).toEqual(data);
  });
});

describe("fromTransactionRaw — maxFee and gasLimit branches", () => {
  it("fromTransactionRaw includes maxFee when present in raw", () => {
    const raw = getMockedTransactionRaw({ maxFee: "5000" });
    const result = fromTransactionRaw(raw);
    expect(result.maxFee).toEqual(new BigNumber(5000));
  });

  it("fromTransactionRaw includes gasLimit when present in raw", () => {
    const raw = { ...getMockedTransactionRaw(), gasLimit: "100000" } as TransactionRaw;
    const result = fromTransactionRaw(raw);
    expect((result as Record<string, unknown>).gasLimit).toEqual(new BigNumber(100000));
  });

  it("toTransactionRaw includes maxFee when present in transaction", () => {
    const tx = getMockedTransaction({ maxFee: new BigNumber(5000) });
    const raw = toTransactionRaw(tx);
    expect(raw.maxFee).toBe("5000");
  });

  it("toTransactionRaw includes gasLimit when present in transaction", () => {
    const tx = { ...getMockedTransaction(), gasLimit: new BigNumber(100000) } as Transaction;
    const raw = toTransactionRaw(tx);
    expect((raw as Record<string, unknown>).gasLimit).toBe("100000");
  });
});

describe("fromTransactionRaw — all modes", () => {
  const token = getMockedHTSTokenCurrency();

  it("TokenAssociate mode preserves assetReference, assetOwner and properties", () => {
    const raw = {
      ...getMockedTransactionRaw(),
      mode: HEDERA_TRANSACTION_MODES.TokenAssociate,
      assetReference: token.contractAddress,
      assetOwner: "0.0.12345",
      properties: { token },
    } as TransactionRaw;

    const result = fromTransactionRaw(raw);

    expect(result.mode).toBe(HEDERA_TRANSACTION_MODES.TokenAssociate);
    expect(
      (result as Extract<Transaction, { mode: typeof HEDERA_TRANSACTION_MODES.TokenAssociate }>)
        .assetReference,
    ).toBe(token.contractAddress);
    expect(
      (result as Extract<Transaction, { mode: typeof HEDERA_TRANSACTION_MODES.TokenAssociate }>)
        .assetOwner,
    ).toBe("0.0.12345");
    expect(
      (result as Extract<Transaction, { mode: typeof HEDERA_TRANSACTION_MODES.TokenAssociate }>)
        .properties,
    ).toEqual({ token });
  });

  it.each([
    HEDERA_TRANSACTION_MODES.Delegate,
    HEDERA_TRANSACTION_MODES.Undelegate,
    HEDERA_TRANSACTION_MODES.Redelegate,
  ])("%s mode preserves properties.stakingNodeId", mode => {
    const raw = {
      ...getMockedTransactionRaw(),
      mode,
      properties: { stakingNodeId: 3 },
    } as TransactionRaw;

    const result = fromTransactionRaw(raw);

    expect(result.mode).toBe(mode);
    expect(
      (result as Extract<Transaction, { mode: typeof HEDERA_TRANSACTION_MODES.Delegate }>)
        .properties,
    ).toEqual({ stakingNodeId: 3 });
  });

  it("ClaimRewards mode round-trips without extra fields", () => {
    const raw = {
      ...getMockedTransactionRaw(),
      mode: HEDERA_TRANSACTION_MODES.ClaimRewards,
    } as TransactionRaw;

    const result = fromTransactionRaw(raw);

    expect(result.mode).toBe(HEDERA_TRANSACTION_MODES.ClaimRewards);
  });
});

describe("toTransactionRaw — all modes", () => {
  const token = getMockedHTSTokenCurrency();

  it("TokenAssociate mode preserves assetReference, assetOwner and properties", () => {
    const tx = {
      ...getMockedTransaction(),
      mode: HEDERA_TRANSACTION_MODES.TokenAssociate,
      assetReference: token.contractAddress,
      assetOwner: "0.0.12345",
      properties: { token },
    } as Transaction;

    const raw = toTransactionRaw(tx);

    expect(raw.mode).toBe(HEDERA_TRANSACTION_MODES.TokenAssociate);
    expect(
      (raw as Extract<TransactionRaw, { mode: typeof HEDERA_TRANSACTION_MODES.TokenAssociate }>)
        .assetReference,
    ).toBe(token.contractAddress);
    expect(
      (raw as Extract<TransactionRaw, { mode: typeof HEDERA_TRANSACTION_MODES.TokenAssociate }>)
        .assetOwner,
    ).toBe("0.0.12345");
  });

  it.each([
    HEDERA_TRANSACTION_MODES.Delegate,
    HEDERA_TRANSACTION_MODES.Undelegate,
    HEDERA_TRANSACTION_MODES.Redelegate,
  ])("%s mode preserves properties.stakingNodeId", mode => {
    const tx = {
      ...getMockedTransaction(),
      mode,
      properties: { stakingNodeId: 5 },
    } as Transaction;

    const raw = toTransactionRaw(tx);

    expect(raw.mode).toBe(mode);
    expect(
      (raw as Extract<TransactionRaw, { mode: typeof HEDERA_TRANSACTION_MODES.Delegate }>)
        .properties,
    ).toEqual({ stakingNodeId: 5 });
  });

  it("ClaimRewards mode serialises without extra fields", () => {
    const tx = {
      ...getMockedTransaction(),
      mode: HEDERA_TRANSACTION_MODES.ClaimRewards,
    } as Transaction;

    const raw = toTransactionRaw(tx);

    expect(raw.mode).toBe(HEDERA_TRANSACTION_MODES.ClaimRewards);
    expect((raw as Record<string, unknown>).properties).toBeUndefined();
  });
});
