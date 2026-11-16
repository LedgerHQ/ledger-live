import {
  AmountRequired,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { ICP_FEES } from "../consts";
import { InvalidMemoICP } from "../errors";
import { Transaction } from "../types";
import { getTransactionStatus } from "./getTransactionStatus";

const SENDER = "bc48adb687ce410003215edd17d4c6a576d4fe6b64e242bac382aa88ccf15417";
const RECIPIENT = "e8a1474afbed438be8b019c4293b9e01b33075d72757ac715183ae7c7ba77e37";

const makeAccount = (overrides: Record<string, unknown> = {}): Account =>
  ({
    currency: { name: "Internet Computer" },
    freshAddress: SENDER,
    freshAddressPath: "44'/223'/0'/0/0",
    balance: new BigNumber(1_000_000_000),
    spendableBalance: new BigNumber(1_000_000_000),
    ...overrides,
  }) as unknown as Account;

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction =>
  ({
    family: "internet_computer",
    type: "send",
    recipient: RECIPIENT,
    amount: new BigNumber(1000),
    fees: new BigNumber(ICP_FEES),
    useAllAmount: false,
    ...overrides,
  }) as Transaction;

describe("getTransactionStatus for a plain send", () => {
  it("returns InvalidAddress on the recipient when it is not an account identifier", async () => {
    const status = await getTransactionStatus(
      makeAccount(),
      makeTransaction({ recipient: "novalidaddress" }),
    );

    expect(Object.keys(status.errors)).toEqual(["recipient"]);
    expect(status.errors.recipient?.name).toEqual("InvalidAddress");
  });

  it("returns RecipientRequired when the recipient is empty", async () => {
    const status = await getTransactionStatus(makeAccount(), makeTransaction({ recipient: "" }));

    expect(status.errors.recipient).toBeInstanceOf(RecipientRequired);
  });

  it("returns InvalidAddressBecauseDestinationIsAlsoSource when the recipient is the sender", async () => {
    const status = await getTransactionStatus(
      makeAccount(),
      makeTransaction({ recipient: SENDER }),
    );

    expect(status.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
  });

  it("returns NotEnoughBalance when the amount plus fees exceeds the spendable balance", async () => {
    const status = await getTransactionStatus(
      makeAccount(),
      makeTransaction({ amount: new BigNumber(300e9) }),
    );

    expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
    expect(status.errors.recipient).toBeUndefined();
  });

  it("returns AmountRequired when a send amount is zero", async () => {
    const status = await getTransactionStatus(
      makeAccount(),
      makeTransaction({ amount: new BigNumber(0) }),
    );

    expect(status.errors.amount).toBeInstanceOf(AmountRequired);
  });

  it("returns InvalidMemoICP when the memo is negative", async () => {
    const status = await getTransactionStatus(makeAccount(), makeTransaction({ memo: "-1" }));

    expect(status.errors.transaction).toBeInstanceOf(InvalidMemoICP);
    expect(Object.keys(status.errors)).toEqual(["transaction"]);
  });

  it("returns no error and the exact amounts for a valid send", async () => {
    const status = await getTransactionStatus(makeAccount(), makeTransaction());

    expect(status.errors).toEqual({});
    expect(status.warnings).toEqual({});
    expect(status.amount).toEqual(new BigNumber(1000));
    expect(status.estimatedFees).toEqual(new BigNumber(10000));
    expect(status.totalSpent).toEqual(new BigNumber(11000));
  });

  it("spends the whole spendable balance minus the fees when useAllAmount is set", async () => {
    const status = await getTransactionStatus(
      makeAccount(),
      makeTransaction({ useAllAmount: true, amount: new BigNumber(0) }),
    );

    expect(status.errors).toEqual({});
    expect(status.amount).toEqual(new BigNumber(999_990_000));
    expect(status.totalSpent).toEqual(new BigNumber(1_000_000_000));
  });

  it("returns NotEnoughBalance when useAllAmount cannot cover the fees", async () => {
    const status = await getTransactionStatus(
      makeAccount({ balance: new BigNumber(5000), spendableBalance: new BigNumber(5000) }),
      makeTransaction({ useAllAmount: true, amount: new BigNumber(0) }),
    );

    expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("returns InvalidAddress on the sender when the account address is not valid", async () => {
    const status = await getTransactionStatus(
      makeAccount({ freshAddress: "senderaddress" }),
      makeTransaction(),
    );

    expect(status.errors.sender?.name).toEqual("InvalidAddress");
  });
});
