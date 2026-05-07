import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { resolveAccountArg, resolveAccountInput, resolveOutputFormat } from "./inputs";
import { makeSessionDir } from "../test/helpers/session-fixture";
import { ETH_DESCRIPTOR } from "../test/helpers/constants";
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

describe("resolveAccountInput", () => {
  let sessionCleanup: (() => void) | undefined;
  let savedXdgStateHome: string | undefined;

  beforeEach(() => {
    savedXdgStateHome = process.env.XDG_STATE_HOME;
  });

  afterEach(() => {
    sessionCleanup?.();
    sessionCleanup = undefined;
    if (savedXdgStateHome === undefined) delete process.env.XDG_STATE_HOME;
    else process.env.XDG_STATE_HOME = savedXdgStateHome;
  });

  it("resolves a known session label to its descriptor", async () => {
    const fixture = makeSessionDir([{ label: "my-eth", descriptor: ETH_DESCRIPTOR }]);
    sessionCleanup = fixture.cleanup;
    process.env.XDG_STATE_HOME = fixture.env.XDG_STATE_HOME;
    const result = await resolveAccountInput("my-eth");
    expect(result).toBe(ETH_DESCRIPTOR);
  });

  it("throws when the label is not found in session", async () => {
    const fixture = makeSessionDir([]);
    sessionCleanup = fixture.cleanup;
    process.env.XDG_STATE_HOME = fixture.env.XDG_STATE_HOME;
    await expect(resolveAccountInput("unknown-label")).rejects.toThrow(
      /No account labeled "unknown-label"/,
    );
  });

  it("rejects a raw descriptor passed directly (contains ':')", async () => {
    const fixture = makeSessionDir([]);
    sessionCleanup = fixture.cleanup;
    process.env.XDG_STATE_HOME = fixture.env.XDG_STATE_HOME;
    let caught: Error | undefined;
    try {
      await resolveAccountInput(ETH_DESCRIPTOR);
    } catch (e) {
      caught = e as Error;
    }
    expect(caught?.message).toMatch(/Raw descriptors are not accepted/);
    // Must not echo the descriptor back (would leak xpub/path into logs).
    expect(caught?.message).not.toContain(ETH_DESCRIPTOR);
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
