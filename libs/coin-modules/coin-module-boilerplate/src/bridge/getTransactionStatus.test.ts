import { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { createBoilerplateContext } from "../config.fixture";
import { Transaction } from "../types";
import { buildGetTransactionStatus } from "./getTransactionStatus";

const account = {
  balance: new BigNumber(1000),
  freshAddress: "sender",
  currency: { name: "Boilerplate", units: [{ name: "BOL", code: "BOL", magnitude: 0 }] },
} as unknown as Account;

const transaction = (amount: number, fee: number) =>
  ({
    recipient: "0x000000000000000000000000000000000000dEaD",
    amount: new BigNumber(amount),
    fee: new BigNumber(fee),
  }) as Transaction;

describe("getTransactionStatus", () => {
  it("warns that the fee is too high with the default ratio of 10", async () => {
    const getTransactionStatus = buildGetTransactionStatus(createBoilerplateContext());

    const status = await getTransactionStatus(account, transaction(10, 2));

    expect(Object.keys(status.warnings)).toEqual(["feeTooHigh"]);
  });

  it("does not warn when the fee times the default ratio does not exceed the amount", async () => {
    const getTransactionStatus = buildGetTransactionStatus(createBoilerplateContext());

    const status = await getTransactionStatus(account, transaction(100, 10));

    expect(status.warnings).toEqual({});
  });

  it("uses the ratio from the config", async () => {
    const getTransactionStatus = buildGetTransactionStatus(
      createBoilerplateContext({ fees: { tooHighRatio: 2 } }),
    );

    const status = await getTransactionStatus(account, transaction(10, 2));

    expect(status.warnings).toEqual({});
  });

  it("applies no reserve by default", async () => {
    const getTransactionStatus = buildGetTransactionStatus(createBoilerplateContext());

    const status = await getTransactionStatus(account, transaction(990, 10));

    expect(status.errors.amount).toEqual(undefined);
  });

  it("reports not enough spendable balance when the config reserve is not left", async () => {
    const getTransactionStatus = buildGetTransactionStatus(
      createBoilerplateContext({ minReserve: 100 }),
    );

    const status = await getTransactionStatus(account, transaction(950, 10));

    expect(status.errors.amount?.name).toEqual("NotEnoughSpendableBalance");
  });
});
