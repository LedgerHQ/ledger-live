import {
  AmountRequired,
  FeeNotLoaded,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { StacksMemoTooLong } from "../errors";
import * as logicValidateMemo from "../logic/validateMemo";
import { Transaction } from "../types";
import { getTransactionStatus } from "./getTransactionStatus";

jest.mock("../logic/validateMemo", () => {
  const actual = jest.requireActual("../logic/validateMemo");
  return {
    ...actual,
    validateMemo: jest.fn(actual.validateMemo), // replace with mock
  };
});

describe("getTransactionStatus", () => {
  const spiedValidateMemo = logicValidateMemo.validateMemo as jest.Mock;

  it("should not set error on transaction when memo is validated", async () => {
    spiedValidateMemo.mockReturnValueOnce(true);

    const account = { currency: { name: "" } } as Account;
    const transaction = { amount: BigNumber(1), memo: "random memo for unit test" } as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.transaction).toBeUndefined();

    expect(spiedValidateMemo).toHaveBeenCalledWith(transaction.memo);
  });

  it("should set error on transaction when memo is invalidated", async () => {
    spiedValidateMemo.mockReturnValueOnce(false);

    const account = { currency: { name: "" } } as Account;
    const transaction = { amount: BigNumber(1), memo: "random memo for unit test" } as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.transaction).toBeInstanceOf(StacksMemoTooLong);

    expect(spiedValidateMemo).toHaveBeenCalledWith(transaction.memo);
  });

  it.each(["delegate", "undelegate", undefined] as const)(
    // The classic bridge's signOperation/createTransaction only ever build a plain transfer, with
    // no pox-5 contract-call support -- recipient validation must stay unconditional (mode included)
    // so a staking-shaped transaction can't fall through and be signed as an ordinary STX transfer.
    "should require recipient regardless of mode (%s)",
    async mode => {
      const account = {
        currency: { name: "" },
        spendableBalance: BigNumber(1000000),
      } as Account;
      const transaction = {
        mode,
        recipient: "",
        amount: BigNumber(100),
        fee: BigNumber(10),
      } as Transaction;

      const status = await getTransactionStatus(account, transaction);

      expect(status.errors.recipient).toBeInstanceOf(RecipientRequired);
    },
  );

  describe("transfers", () => {
    const SENDER = "SP26AZ1JSFZQ82VH5W2NJSB2QW15EW5YKT6WMD69J";
    const RECIPIENT = "SPNX9YY3T4GR4XDSNRVWB2MDQVCTJMP3BGT7VCZA";

    const makeAccount = (spendable = 10_000, subAccounts: unknown[] = []): Account =>
      ({
        currency: { name: "Stacks" },
        freshAddress: SENDER,
        freshAddressPath: "",
        spendableBalance: BigNumber(spendable),
        subAccounts,
      }) as unknown as Account;

    const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction =>
      ({
        recipient: RECIPIENT,
        amount: BigNumber(1000),
        fee: BigNumber(200),
        ...overrides,
      }) as Transaction;

    it("flags an invalid recipient address", async () => {
      const status = await getTransactionStatus(
        makeAccount(1_000_000),
        makeTransaction({
          recipient: "invalidaddress",
          amount: BigNumber(100),
          fee: BigNumber(10),
        }),
      );

      expect(status.errors.recipient).toBeInstanceOf(InvalidAddress);
    });

    it("flags a recipient equal to the account address", async () => {
      const status = await getTransactionStatus(
        makeAccount(),
        makeTransaction({ recipient: SENDER }),
      );

      expect(status.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
    });

    it("flags a missing fee", async () => {
      const status = await getTransactionStatus(
        makeAccount(),
        makeTransaction({ fee: undefined as never }),
      );

      expect(status.errors.gas).toBeInstanceOf(FeeNotLoaded);
    });

    it("returns the amount plus the fee as total spent for a valid STX transfer", async () => {
      const status = await getTransactionStatus(makeAccount(), makeTransaction());

      expect(status.errors).toEqual({});
      expect(status.amount).toEqual(BigNumber(1000));
      expect(status.totalSpent).toEqual(BigNumber(1200));
    });

    it("flags an STX amount above the spendable balance", async () => {
      const status = await getTransactionStatus(
        makeAccount(),
        makeTransaction({ amount: BigNumber(10_000_000_000) }),
      );

      expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("flags a zero STX amount", async () => {
      const status = await getTransactionStatus(
        makeAccount(),
        makeTransaction({ amount: BigNumber(0) }),
      );

      expect(status.errors.amount).toBeInstanceOf(AmountRequired);
    });

    it("resolves STX useAllAmount to the spendable balance minus the fee", async () => {
      const status = await getTransactionStatus(
        makeAccount(),
        makeTransaction({ useAllAmount: true, amount: BigNumber(0) }),
      );

      expect(status.errors).toEqual({});
      expect(status.amount).toEqual(BigNumber(9800));
      expect(status.totalSpent).toEqual(BigNumber(10_000));
    });

    it("flags STX useAllAmount when the fee exceeds the balance", async () => {
      const status = await getTransactionStatus(
        makeAccount(100),
        makeTransaction({ useAllAmount: true, amount: BigNumber(0) }),
      );

      expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    describe("with a token sub account", () => {
      const tokenAccount = { type: "TokenAccount", id: "sub1", spendableBalance: BigNumber(1000) };
      const makeTokenTransaction = (overrides: Partial<Transaction> = {}) =>
        makeTransaction({
          subAccountId: "sub1",
          amount: BigNumber(10),
          fee: BigNumber(180),
          ...overrides,
        });

      it("returns no errors for a valid token transfer", async () => {
        const status = await getTransactionStatus(
          makeAccount(10_000, [tokenAccount]),
          makeTokenTransaction(),
        );

        expect(status.errors).toEqual({});
        expect(status.amount).toEqual(BigNumber(10));
        expect(status.totalSpent).toEqual(BigNumber(10));
      });

      it("flags a token amount above the token spendable balance", async () => {
        const status = await getTransactionStatus(
          makeAccount(10_000, [tokenAccount]),
          makeTokenTransaction({ amount: BigNumber("10000000000000000") }),
        );

        expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
      });

      it("resolves token useAllAmount to the token spendable balance", async () => {
        const status = await getTransactionStatus(
          makeAccount(10_000, [tokenAccount]),
          makeTokenTransaction({ useAllAmount: true, amount: BigNumber(10) }),
        );

        expect(status.errors).toEqual({});
        expect(status.amount).toEqual(BigNumber(1000));
      });

      it("flags a zero token amount", async () => {
        const status = await getTransactionStatus(
          makeAccount(10_000, [tokenAccount]),
          makeTokenTransaction({ amount: BigNumber(0) }),
        );

        expect(status.errors.amount).toBeInstanceOf(AmountRequired);
      });
    });
  });
});
