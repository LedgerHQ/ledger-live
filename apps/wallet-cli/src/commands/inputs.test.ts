import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { resolveAccountArg, resolveOutputFormat } from "./inputs";
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

describe("resolveOutputFormat", () => {
  let savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    savedEnv = {};
    for (const key of ["AGENT"]) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(savedEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("defaults to human when no agent environment is detected", () => {
    expect(resolveOutputFormat(undefined)).toBe("human");
  });

  it("preserves an explicitly requested output format", () => {
    expect(resolveOutputFormat("human")).toBe("human");
    expect(resolveOutputFormat("json")).toBe("json");
  });
});
