import { describe, expect, it } from "bun:test";
import { parseShortAccountDescriptor, parseAccountDescriptor, resolveAccountArg } from "./models";
import { XPUB } from "../shared/accountDescriptor/test-fixtures";

const SHORT = `js:2:bitcoin:${XPUB}:native_segwit:0`;

describe("parseShortAccountDescriptor", () => {
  it("parses a valid short descriptor", () => {
    const result = parseShortAccountDescriptor(SHORT);
    expect(result.currencyId).toBe("bitcoin");
    expect(result.seedIdentifier).toBe(XPUB);
    expect(result.derivationMode).toBe("native_segwit");
    expect(result.index).toBe(0);
    expect(result.freshAddress).toBe("");
    expect(result.id).toBe(`js:2:bitcoin:${XPUB}:native_segwit`);
  });

  it("parses non-zero account index", () => {
    const result = parseShortAccountDescriptor(`js:2:bitcoin:${XPUB}:native_segwit:3`);
    expect(result.index).toBe(3);
  });

  it("throws when there is no colon", () => {
    expect(() => parseShortAccountDescriptor("nocolon")).toThrow(
      /Invalid short account descriptor/,
    );
  });

  it("throws when index is not a number", () => {
    expect(() => parseShortAccountDescriptor(`js:2:bitcoin:${XPUB}:native_segwit:abc`)).toThrow(
      /Invalid short account descriptor/,
    );
  });
});

describe("parseAccountDescriptor", () => {
  it("delegates to toV0(parseV1()) for V1-prefixed input", () => {
    const v1Input = `account:1:utxo:bitcoin:main:${XPUB}:m/84h/0h/0h`;
    const result = parseAccountDescriptor(v1Input);
    expect(result.currencyId).toBe("bitcoin");
    expect(result.seedIdentifier).toBe(XPUB);
    expect(result.derivationMode).toBe("native_segwit");
    expect(result.index).toBe(0);
  });

  it("delegates to parseShortAccountDescriptor for js:2: input", () => {
    const result = parseAccountDescriptor(SHORT);
    expect(result.currencyId).toBe("bitcoin");
    expect(result.index).toBe(0);
  });

  it("propagates errors from parseV1 for invalid V1 input", () => {
    expect(() => parseAccountDescriptor("account:1:bad")).toThrow();
  });
});

describe("resolveAccountArg", () => {
  it("prefers the --account flag over positional", () => {
    expect(resolveAccountArg(SHORT, ["other"])).toBe(SHORT);
  });

  it("falls back to the first positional argument", () => {
    expect(resolveAccountArg(undefined, [SHORT])).toBe(SHORT);
  });

  it("throws when both are missing", () => {
    expect(() => resolveAccountArg(undefined, [])).toThrow(/Missing account/);
  });
});
