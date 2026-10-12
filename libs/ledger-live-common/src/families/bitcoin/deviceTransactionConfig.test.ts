import { BigNumber } from "bignumber.js";
import accountModule from "./account";
import getDeviceTransactionConfig from "./deviceTransactionConfig";
import type { Transaction, TransactionStatus } from "./types";

const transaction = (familySpecificData?: Transaction["familySpecificData"]): Transaction => ({
  family: "bitcoin",
  amount: new BigNumber(0),
  recipient: "",
  feesStrategy: "medium",
  ...(familySpecificData ? { familySpecificData } : {}),
});

const status = (amount: number, estimatedFees: number): TransactionStatus => ({
  errors: {},
  warnings: {},
  amount: new BigNumber(amount),
  estimatedFees: new BigNumber(estimatedFees),
  totalSpent: new BigNumber(amount + estimatedFees),
});

const config = (tx: Transaction, s: TransactionStatus) =>
  getDeviceTransactionConfig({
    account: {} as never,
    parentAccount: null,
    transaction: tx,
    status: s,
  });

describe("getDeviceTransactionConfig", () => {
  it("shows the amount, the fees and the OP_RETURN data the device displays", async () => {
    expect(await config(transaction({ opReturnData: "6869" }), status(1_000, 250))).toEqual([
      { type: "amount", label: "Amount" },
      { type: "fees", label: "Fees" },
      { type: "opReturnData", label: "OP_RETURN" },
    ]);
  });

  it("leaves out what is zero or missing", async () => {
    expect(await config(transaction(), status(0, 0))).toEqual([]);
  });
});

describe("account module", () => {
  it("shows Bitcoin Cash receive addresses as cashaddr", () => {
    const account = (id: string) => ({ currency: { id } }) as never;
    expect(accountModule.injectGetAddressParams?.(account("bitcoin_cash"))).toEqual({
      forceFormat: "cashaddr",
    });
    expect(accountModule.injectGetAddressParams?.(account("bitcoin"))).toEqual({});
  });
});
