import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
  FeeNotLoaded,
} from "@ledgerhq/errors";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import getTransactionStatus from "./getTransactionStatus";

const account = createFixtureAccount();

describe("getTransactionStatus", () => {
  it("should return errors if recipient empty", async () => {
    const transaction = createFixtureTransaction({ recipient: null });
    const result = await getTransactionStatus(account, transaction);

    const expected = { recipient: new RecipientRequired() };
    expect(result.errors).toEqual(expected);
  });
  it("should return errors if recipient is invalid sui adress", async () => {
    const transaction = createFixtureTransaction({ recipient: "notValidSuiAddress" });
    const result = await getTransactionStatus(account, transaction);

    const expected = { recipient: new InvalidAddress() };
    expect(result.errors).toEqual(expected);
  });
  it("should return errors if recipient equals to sender", async () => {
    const transaction = createFixtureTransaction({ recipient: account.freshAddress });
    const result = await getTransactionStatus(account, transaction);

    const expected = { recipient: new InvalidAddressBecauseDestinationIsAlsoSource() };
    expect(result.errors).toEqual(expected);
  });
  it("should return errors if amount not provided", async () => {
    const transaction = createFixtureTransaction({ amount: null });
    const result = await getTransactionStatus(account, transaction);

    const expected = { amount: new AmountRequired() };
    expect(result.errors).toEqual(expected);
  });
  it("should return errors if amount exceeds balance", async () => {
    const transaction = createFixtureTransaction({ amount: account.balance.plus(1) });
    const result = await getTransactionStatus(account, transaction);

    const expected = { amount: new NotEnoughBalance() };
    expect(result.errors).toEqual(expected);
  });
  it("should return errors if amount exceeds balance", async () => {
    const transaction = createFixtureTransaction({ fees: null });
    const result = await getTransactionStatus(account, transaction);

    const expected = { fees: new FeeNotLoaded() };
    expect(result.errors).toEqual(expected);
  });
});
