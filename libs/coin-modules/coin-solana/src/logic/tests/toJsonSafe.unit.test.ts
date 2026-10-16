import { BigNumber } from "bignumber.js";
import { toJsonSafe } from "../toJsonSafe";

describe("toJsonSafe", () => {
  it("writes a bigint as a decimal string", () => {
    expect(toJsonSafe({ fee: 12345678901234567890n })).toEqual({ fee: "12345678901234567890" });
  });

  it("writes a BigNumber in fixed notation, even where its own JSON form uses an exponent", () => {
    const amount = new BigNumber("1e+30");

    expect(amount.toJSON()).toBe("1e+30");
    expect(toJsonSafe({ amount })).toEqual({ amount: "1000000000000000000000000000000" });
  });

  it("writes the BigNumbers and bigints nested in arrays", () => {
    expect(toJsonSafe([{ values: [new BigNumber("0.0000001"), 2n] }])).toEqual([
      { values: ["0.0000001", "2"] },
    ]);
  });

  it("writes a top-level BigNumber or bigint", () => {
    expect(toJsonSafe(new BigNumber(5))).toBe("5");
    expect(toJsonSafe(7n)).toBe("7");
  });

  it("writes a date as an ISO string", () => {
    expect(toJsonSafe({ at: new Date("2026-01-01T00:00:00.000Z") })).toEqual({
      at: "2026-01-01T00:00:00.000Z",
    });
  });

  it("keeps JSON's own form of a Buffer, a Map and a Set", () => {
    expect(
      toJsonSafe({ data: Buffer.from([1, 2]), map: new Map([["a", 1]]), set: new Set([1]) }),
    ).toEqual({ data: { type: "Buffer", data: [1, 2] }, map: {}, set: {} });
  });

  it("drops the undefined fields and keeps null", () => {
    expect(toJsonSafe({ a: undefined, b: null, c: { d: undefined } })).toEqual({ b: null, c: {} });
  });

  it("answers null for a top-level undefined", () => {
    expect(toJsonSafe(undefined)).toBeNull();
  });

  it("recognises a BigNumber of another copy of bignumber.js", () => {
    const foreign = {
      _isBigNumber: true,
      toFixed: () => "1000000000000000000000",
      toJSON: () => "1e+21",
    };

    expect(toJsonSafe({ foreign })).toEqual({ foreign: "1000000000000000000000" });
  });

  it("keeps an object that merely carries a toFixed method", () => {
    const value = { toFixed: () => "nope", amount: 1 };

    expect(toJsonSafe({ value })).toEqual({ value: { amount: 1 } });
  });
});
