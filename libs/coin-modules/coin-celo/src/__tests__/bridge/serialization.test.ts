import BigNumber from "bignumber.js";
import { NATIVE_FEE_CURRENCY_MARKER } from "../../constants";
import { fromOperationExtraRaw, toOperationExtraRaw } from "../../bridge/serialization";

describe("fromOperationExtraRaw", () => {
  it("returns an empty extra when the raw payload has no celo-specific keys", () => {
    expect(fromOperationExtraRaw({ unrelated: "value" })).toEqual({});
  });

  it("rehydrates celoOperationValue as a BigNumber", () => {
    const extra = fromOperationExtraRaw({ celoOperationValue: "42" });
    expect(extra).toEqual({ celoOperationValue: new BigNumber(42) });
  });

  it("passes celoSourceValidator through unchanged", () => {
    const extra = fromOperationExtraRaw({ celoSourceValidator: "0xabc" });
    expect(extra).toEqual({ celoSourceValidator: "0xabc" });
  });

  it("passes feeCurrencyAddress through unchanged", () => {
    const extra = fromOperationExtraRaw({
      feeCurrencyAddress: "0xceba9300f2b948710d2653dd7b07f33a8b32118c",
    });
    expect(extra).toEqual({
      feeCurrencyAddress: "0xceba9300f2b948710d2653dd7b07f33a8b32118c",
    });
  });

  it("preserves the NATIVE sentinel", () => {
    const extra = fromOperationExtraRaw({ feeCurrencyAddress: NATIVE_FEE_CURRENCY_MARKER });
    expect(extra).toEqual({ feeCurrencyAddress: NATIVE_FEE_CURRENCY_MARKER });
  });
});

describe("toOperationExtraRaw", () => {
  it("returns an empty raw when the extra has no celo-specific keys", () => {
    expect(toOperationExtraRaw({ unrelated: "value" })).toEqual({});
  });

  it("serializes celoOperationValue to a string", () => {
    const raw = toOperationExtraRaw({ celoOperationValue: new BigNumber("1500000000000000000") });
    expect(raw).toEqual({ celoOperationValue: "1500000000000000000" });
  });

  it("passes celoSourceValidator through unchanged", () => {
    expect(toOperationExtraRaw({ celoSourceValidator: "0xabc" })).toEqual({
      celoSourceValidator: "0xabc",
    });
  });

  it("passes feeCurrencyAddress through unchanged", () => {
    expect(
      toOperationExtraRaw({
        feeCurrencyAddress: "0xceba9300f2b948710d2653dd7b07f33a8b32118c",
      }),
    ).toEqual({ feeCurrencyAddress: "0xceba9300f2b948710d2653dd7b07f33a8b32118c" });
  });

  it("preserves the NATIVE sentinel", () => {
    expect(toOperationExtraRaw({ feeCurrencyAddress: NATIVE_FEE_CURRENCY_MARKER })).toEqual({
      feeCurrencyAddress: NATIVE_FEE_CURRENCY_MARKER,
    });
  });
});

describe("round-trip serialization", () => {
  it("preserves all celo extras across to/from", () => {
    const original = {
      celoOperationValue: new BigNumber("100"),
      celoSourceValidator: "0xabc",
      feeCurrencyAddress: "0xceba9300f2b948710d2653dd7b07f33a8b32118c",
    };
    expect(fromOperationExtraRaw(toOperationExtraRaw(original))).toEqual(original);
  });
});
