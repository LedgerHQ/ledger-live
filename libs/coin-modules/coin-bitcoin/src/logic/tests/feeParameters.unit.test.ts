import { amountParameter, toBigInt } from "../feeParameters";

describe("toBigInt", () => {
  it("reads bigints, safe integers and integer strings", () => {
    expect(toBigInt(5n, "x")).toBe(5n);
    expect(toBigInt(5, "x")).toBe(5n);
    expect(toBigInt("2100000000000000", "x")).toBe(2_100_000_000_000_000n);
    expect(toBigInt(0n, "x")).toBe(0n);
  });

  it.each([1.5, "1.5", "abc", "", null, {}, Number.MAX_SAFE_INTEGER + 1, "-1", -1, -1n])(
    "refuses %p",
    value => {
      expect(() => toBigInt(value, "amount")).toThrow(
        "amount must be a non-negative integer amount",
      );
    },
  );
});

describe("amountParameter", () => {
  it("reads a parameter as a bigint, from the JSON-safe string Ledger Live stores", () => {
    expect(amountParameter({ amount: "900" }, "amount")).toBe(900n);
    expect(amountParameter({ amount: 900n }, "amount")).toBe(900n);
  });

  it("is undefined when the parameter is absent", () => {
    expect(amountParameter({}, "amount")).toBeUndefined();
    expect(amountParameter({ amount: null }, "amount")).toBeUndefined();
    expect(amountParameter(undefined, "amount")).toBeUndefined();
  });
});
