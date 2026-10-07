import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/types";
import { normalizeBalances, normalizeFees, normalizeIntent, toBigInt } from "../normalize";

describe("toBigInt", () => {
  it("reads bigints, safe integers and integer strings", () => {
    expect(toBigInt(5n, "x")).toBe(5n);
    expect(toBigInt(5, "x")).toBe(5n);
    expect(toBigInt("2100000000000000", "x")).toBe(2_100_000_000_000_000n);
    expect(toBigInt("-1", "x")).toBe(-1n);
  });

  it.each([1.5, "1.5", "abc", "", null, {}, Number.MAX_SAFE_INTEGER + 1])("refuses %p", value => {
    expect(() => toBigInt(value, "amount")).toThrow("amount must be an integer amount");
  });
});

describe("normalize (amounts from a JSON consumer, as coin-service passes them)", () => {
  it("normalizes the intent amount", () => {
    const intent = { amount: "1000", sender: "a" } as unknown as TransactionIntent;
    expect(normalizeIntent(intent)).toEqual({ amount: 1000n, sender: "a" });
  });

  it("normalizes the custom fee value and its numeric parameters only", () => {
    expect(
      normalizeFees({
        value: "0" as unknown as bigint,
        parameters: { feesStrategy: "fast", feePerByte: "3", amount: "900", other: "x" },
      }),
    ).toEqual({
      value: 0n,
      parameters: { feesStrategy: "fast", feePerByte: 3n, amount: 900n, other: "x" },
    });
    expect(normalizeFees(undefined)).toBeUndefined();
  });

  it("normalizes balances", () => {
    expect(
      normalizeBalances([
        {
          value: "10" as unknown as bigint,
          locked: "1" as unknown as bigint,
          asset: { type: "native" },
        },
      ]),
    ).toEqual([{ value: 10n, locked: 1n, asset: { type: "native" } }]);
  });
});
