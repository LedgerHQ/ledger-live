import { BigNumber } from "bignumber.js";
import { NATIVE_FEE_CURRENCY_MARKER } from "../../constants";
import {
  isCeloOperationExtra,
  isCeloOperationExtraRaw,
  type CeloOperationExtra,
} from "../../types/types";

describe("isCeloOperationExtra", () => {
  it("rejects null", () => {
    expect(isCeloOperationExtra(null as unknown as object)).toBe(false);
  });

  it("rejects an empty object (no recognisable keys)", () => {
    expect(isCeloOperationExtra({})).toBe(false);
  });

  it("rejects an object whose only key is foreign", () => {
    expect(isCeloOperationExtra({ someOtherFamilyKey: "0x123" } as unknown as object)).toBe(false);
  });

  it("accepts an extra with celoOperationValue", () => {
    const extra: CeloOperationExtra = { celoOperationValue: new BigNumber(100) };
    expect(isCeloOperationExtra(extra)).toBe(true);
  });

  it("accepts an extra with celoSourceValidator", () => {
    expect(
      isCeloOperationExtra({ celoSourceValidator: "0xabc0000000000000000000000000000000000001" }),
    ).toBe(true);
  });

  it("accepts the NATIVE_FEE_CURRENCY_MARKER sentinel", () => {
    expect(isCeloOperationExtra({ feeCurrencyAddress: NATIVE_FEE_CURRENCY_MARKER })).toBe(true);
  });

  it("accepts a lowercased 20-byte hex address as feeCurrencyAddress", () => {
    expect(
      isCeloOperationExtra({ feeCurrencyAddress: "0xabcdef0123456789abcdef0123456789abcdef01" }),
    ).toBe(true);
  });

  it("rejects a malformed feeCurrencyAddress (too short)", () => {
    expect(isCeloOperationExtra({ feeCurrencyAddress: "0xdeadbeef" })).toBe(false);
  });

  it("rejects a malformed feeCurrencyAddress (non-string)", () => {
    expect(isCeloOperationExtra({ feeCurrencyAddress: 123 } as unknown as object)).toBe(false);
  });

  it("rejects a string feeCurrencyAddress without the 0x prefix", () => {
    expect(
      isCeloOperationExtra({ feeCurrencyAddress: "abcdef0123456789abcdef0123456789abcdef01" }),
    ).toBe(false);
  });
});

describe("isCeloOperationExtraRaw", () => {
  it("rejects null", () => {
    expect(isCeloOperationExtraRaw(null as unknown as object)).toBe(false);
  });

  it("accepts an extra with celoOperationValue as a string", () => {
    expect(isCeloOperationExtraRaw({ celoOperationValue: "100" })).toBe(true);
  });

  it("accepts the NATIVE sentinel in raw form", () => {
    expect(isCeloOperationExtraRaw({ feeCurrencyAddress: NATIVE_FEE_CURRENCY_MARKER })).toBe(true);
  });

  it("rejects an object with no celo-specific keys", () => {
    expect(isCeloOperationExtraRaw({ unrelated: "value" } as unknown as object)).toBe(false);
  });
});
