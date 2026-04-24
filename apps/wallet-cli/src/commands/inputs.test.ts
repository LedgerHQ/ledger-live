import { describe, expect, it } from "bun:test";
import { resolveAccountArg } from "./inputs";
import { XPUB } from "../shared/accountDescriptor/test-fixtures";

const SHORT = `js:2:bitcoin:${XPUB}:native_segwit:0`;

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
