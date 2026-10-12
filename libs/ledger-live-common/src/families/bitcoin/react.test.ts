import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { useFeesStrategy } from "./react";
import type { Transaction } from "./types";

const currency = getCryptoCurrencyById("bitcoin");
const account = { currency } as unknown as Account;

const transaction = (feeParameters?: Record<string, unknown>): Transaction =>
  ({
    family: "bitcoin",
    amount: new BigNumber(0),
    recipient: "",
    ...(feeParameters ? { feeParameters } : {}),
  }) as unknown as Transaction;

describe("useFeesStrategy", () => {
  it("returns no preset before any estimation", () => {
    expect(useFeesStrategy(account, transaction())).toEqual([]);
  });

  it("returns no preset when the estimation carries no fee rates", () => {
    expect(useFeesStrategy(account, transaction({ feePerByte: "3" }))).toEqual([]);
  });

  it("returns the slow, medium and fast rates of the estimation, in the smallest unit", () => {
    const strategies = useFeesStrategy(
      account,
      transaction({ feeRates: { slow: "1", medium: "2.5", fast: "10" } }),
    );

    const sat = currency.units[currency.units.length - 1];
    expect(strategies).toEqual([
      { label: "slow", amount: new BigNumber(1), unit: sat },
      { label: "medium", amount: new BigNumber("2.5"), unit: sat },
      { label: "fast", amount: new BigNumber(10), unit: sat },
    ]);
  });
});
