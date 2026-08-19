import { readFileSync } from "node:fs";
import { join } from "node:path";
import { RFC6238_SECRET } from "./__mocks__/fetchMock";
import { ENV_VARS, resolveBaanxAuthConfig } from "./config";
import type { EnvSource } from "./config";
import { BaanxConfigError, BaanxInvalidConfigError } from "./errors";
import { DEFAULT_BAANX_BASE_URL } from "./types";

/** A complete environment; individual tests remove or override entries. */
function fullEnv(overrides: EnvSource = {}): EnvSource {
  return {
    [ENV_VARS.clientKey]: "env-client-key",
    [ENV_VARS.email]: "env@ledger.test",
    [ENV_VARS.password]: "env-password",
    [ENV_VARS.totpSecret]: RFC6238_SECRET,
    ...overrides,
  };
}

describe("resolveBaanxAuthConfig", () => {
  it("reads everything from the environment and defaults the rest", () => {
    const config = resolveBaanxAuthConfig({}, fullEnv());

    expect(config).toEqual({
      baseUrl: DEFAULT_BAANX_BASE_URL,
      clientKey: "env-client-key",
      email: "env@ledger.test",
      password: "env-password",
      region: "international",
      totp: { secret: RFC6238_SECRET, digits: 6, period: 30, algorithm: "SHA1" },
    });
  });

  it("defaults to the sandbox host", () => {
    expect(resolveBaanxAuthConfig({}, fullEnv()).baseUrl).toBe("https://dev.api.baanx.com");
  });

  it("lets an explicit base URL swap the environment", () => {
    const config = resolveBaanxAuthConfig({ baseUrl: "https://staging.api.baanx.test" }, fullEnv());

    expect(config.baseUrl).toBe("https://staging.api.baanx.test");
  });

  it("trims a trailing slash so paths do not double up", () => {
    const config = resolveBaanxAuthConfig({}, fullEnv({ [ENV_VARS.baseUrl]: "https://x.test///" }));

    expect(config.baseUrl).toBe("https://x.test");
  });

  it("prefers explicit config over the environment", () => {
    const config = resolveBaanxAuthConfig(
      { clientKey: "explicit-key", email: "explicit@ledger.test" },
      fullEnv(),
    );

    expect(config.clientKey).toBe("explicit-key");
    expect(config.email).toBe("explicit@ledger.test");
    // Untouched fields still come from the environment.
    expect(config.password).toBe("env-password");
  });

  it("does not trim a password, whose whitespace may be significant", () => {
    const config = resolveBaanxAuthConfig({}, fullEnv({ [ENV_VARS.password]: "  spaced  " }));

    expect(config.password).toBe("  spaced  ");
  });

  it("trims incidental whitespace from other values", () => {
    const config = resolveBaanxAuthConfig({}, fullEnv({ [ENV_VARS.email]: "  a@b.test  " }));

    expect(config.email).toBe("a@b.test");
  });

  describe("missing configuration", () => {
    it.each([[ENV_VARS.clientKey], [ENV_VARS.email], [ENV_VARS.password], [ENV_VARS.totpSecret]])(
      "throws naming %s when it is absent",
      variable => {
        const env = fullEnv();
        delete env[variable];

        const call = () => resolveBaanxAuthConfig({}, env);

        expect(call).toThrow(BaanxConfigError);
        expect(call).toThrow(new RegExp(variable));
      },
    );

    it("treats an empty or whitespace value as missing", () => {
      expect(() => resolveBaanxAuthConfig({}, fullEnv({ [ENV_VARS.clientKey]: "   " }))).toThrow(
        BaanxConfigError,
      );
    });

    it("lists every missing variable at once", () => {
      let error: BaanxConfigError | null = null;
      try {
        resolveBaanxAuthConfig({}, {});
      } catch (caught) {
        error = caught as BaanxConfigError;
      }

      expect(error?.missingVars).toEqual([
        ENV_VARS.clientKey,
        ENV_VARS.email,
        ENV_VARS.password,
        ENV_VARS.totpSecret,
      ]);
    });

    it("never puts a secret value in the message", () => {
      const env = fullEnv({ [ENV_VARS.clientKey]: "" });

      try {
        resolveBaanxAuthConfig({}, env);
      } catch (error) {
        expect((error as Error).message).not.toContain(RFC6238_SECRET);
        expect((error as Error).message).not.toContain("env-password");
      }
    });
  });

  describe("region", () => {
    it("defaults to international", () => {
      expect(resolveBaanxAuthConfig({}, fullEnv()).region).toBe("international");
    });

    it.each([
      ["us", "us"],
      ["US", "us"],
      ["international", "international"],
    ])("accepts %p from the environment", (raw, expected) => {
      expect(resolveBaanxAuthConfig({}, fullEnv({ [ENV_VARS.region]: raw })).region).toBe(expected);
    });

    it("rejects anything else", () => {
      expect(() => resolveBaanxAuthConfig({}, fullEnv({ [ENV_VARS.region]: "eu" }))).toThrow(
        BaanxInvalidConfigError,
      );
    });
  });

  describe("TOTP parameters", () => {
    it("reads digits, period and algorithm from the environment", () => {
      const config = resolveBaanxAuthConfig(
        {},
        fullEnv({
          [ENV_VARS.totpDigits]: "8",
          [ENV_VARS.totpPeriod]: "60",
          [ENV_VARS.totpAlgorithm]: "sha256",
        }),
      );

      expect(config.totp).toMatchObject({ digits: 8, period: 60, algorithm: "SHA256" });
    });

    it("lets explicit config win", () => {
      const config = resolveBaanxAuthConfig(
        { totp: { secret: RFC6238_SECRET, digits: 7 } },
        fullEnv({ [ENV_VARS.totpDigits]: "8" }),
      );

      expect(config.totp.digits).toBe(7);
    });

    it.each([
      [ENV_VARS.totpDigits, "0"],
      [ENV_VARS.totpDigits, "99"],
      [ENV_VARS.totpDigits, "six"],
      [ENV_VARS.totpDigits, "6.5"],
      [ENV_VARS.totpPeriod, "0"],
      [ENV_VARS.totpPeriod, "-30"],
      [ENV_VARS.totpAlgorithm, "MD5"],
    ])("rejects %s=%p", (variable, value) => {
      expect(() => resolveBaanxAuthConfig({}, fullEnv({ [variable]: value }))).toThrow(
        BaanxInvalidConfigError,
      );
    });
  });
});

/**
 * `.env.sample` is the only place a newcomer learns what to set, so it drifting
 * from the code is a silent failure. Commented-out optional entries count.
 */
describe(".env.sample", () => {
  const sample = readFileSync(join(__dirname, "..", ".env.sample"), "utf8");
  const documented = new Set(
    sample.match(/^#?(BAANX_[A-Z_]+)/gm)?.map(line => line.replace("#", "")),
  );

  it.each(Object.values(ENV_VARS))("documents %s", variable => {
    expect(documented.has(variable)).toBe(true);
  });

  it("documents nothing the code does not read", () => {
    expect([...documented].sort()).toEqual(Object.values(ENV_VARS).sort());
  });

  it("ships no filled-in values", () => {
    const filled = sample
      .split("\n")
      .filter(line => /^BAANX_[A-Z_]+=/.test(line) && !/^BAANX_[A-Z_]+=""$/.test(line));

    expect(filled).toEqual([]);
  });
});
