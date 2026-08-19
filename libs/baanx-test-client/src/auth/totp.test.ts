import { createFakeClock, RFC6238_SECRET } from "../__mocks__/fetchMock";
import { BaanxTotpSecretError } from "../errors";
import { generateFreshTotpCode, generateTotpCodeAt, totpWindow } from "./totp";
import type { BaanxTotpConfig } from "../types";

function totpConfig(overrides: Partial<BaanxTotpConfig> = {}): Required<BaanxTotpConfig> {
  return { secret: RFC6238_SECRET, digits: 6, period: 30, algorithm: "SHA1", ...overrides };
}

describe("totpWindow", () => {
  it("locates the window containing a timestamp", () => {
    // 30s windows start at multiples of 30_000.
    expect(totpWindow(30, 61_000)).toEqual({
      counter: 2,
      startsAt: 60_000,
      endsAt: 90_000,
      remainingMs: 29_000,
    });
  });

  it("treats the exact boundary as the start of the new window", () => {
    expect(totpWindow(30, 60_000)).toMatchObject({
      counter: 2,
      startsAt: 60_000,
      remainingMs: 30_000,
    });
  });

  it("honours a non-standard period", () => {
    expect(totpWindow(60, 61_000)).toMatchObject({ counter: 1, startsAt: 60_000, endsAt: 120_000 });
  });
});

describe("generateTotpCodeAt", () => {
  // RFC 6238 appendix B, SHA1, secret "12345678901234567890".
  it.each([
    [59, "94287082"],
    [1_111_111_109, "07081804"],
    [1_111_111_111, "14050471"],
    [1_234_567_890, "89005924"],
    [2_000_000_000, "69279037"],
    [20_000_000_000, "65353130"],
  ])("matches the RFC 6238 vector at T=%i", (seconds, expected) => {
    expect(generateTotpCodeAt(totpConfig({ digits: 8 }), seconds * 1_000)).toBe(expected);
  });

  it("truncates to the configured digit count", () => {
    expect(generateTotpCodeAt(totpConfig({ digits: 6 }), 59_000)).toBe("287082");
  });

  it("produces the same code anywhere inside one window", () => {
    const config = totpConfig();
    expect(generateTotpCodeAt(config, 60_000)).toBe(generateTotpCodeAt(config, 89_999));
  });

  it("produces a different code in the next window", () => {
    const config = totpConfig();
    expect(generateTotpCodeAt(config, 89_999)).not.toBe(generateTotpCodeAt(config, 90_000));
  });

  it("changes with the algorithm", () => {
    expect(generateTotpCodeAt(totpConfig({ algorithm: "SHA1" }), 59_000)).not.toBe(
      generateTotpCodeAt(totpConfig({ algorithm: "SHA256" }), 59_000),
    );
  });

  it("accepts a setup key written with spaces and lower case", () => {
    const spaced = "gezd gnbv gy3t qojq gezd gnbv gy3t qojq";
    expect(generateTotpCodeAt(totpConfig({ secret: spaced }), 59_000)).toBe(
      generateTotpCodeAt(totpConfig(), 59_000),
    );
  });

  it("rejects a secret that is not base32, without quoting it", () => {
    const secret = "not-valid-base32-!!!";

    expect(() => generateTotpCodeAt(totpConfig({ secret }), 59_000)).toThrow(BaanxTotpSecretError);
    expect(() => generateTotpCodeAt(totpConfig({ secret }), 59_000)).toThrow(
      /BAANX_TEST_USER_TOTP_SECRET/,
    );
    // The offending value must never reach the message.
    expect(() => generateTotpCodeAt(totpConfig({ secret }), 59_000)).not.toThrow(
      new RegExp(secret.replace(/[!]/g, "\\!")),
    );
  });
});

describe("generateFreshTotpCode", () => {
  it("uses the current window when there is time left", async () => {
    const { clock, sleeps } = createFakeClock(61_000);

    const result = await generateFreshTotpCode(totpConfig(), clock);

    expect(sleeps).toEqual([]);
    expect(result.waitedMs).toBe(0);
    expect(result.windowEndsAt).toBe(90_000);
    expect(result.code).toBe(generateTotpCodeAt(totpConfig(), 61_000));
  });

  it("waits for the next window when the current one is about to roll over", async () => {
    // 1s left: a code sent now could expire before Baanx validates it.
    const { clock, sleeps } = createFakeClock(89_000);

    const result = await generateFreshTotpCode(totpConfig(), clock);

    expect(sleeps).toEqual([1_000]);
    expect(result.waitedMs).toBe(1_000);
    expect(result.windowEndsAt).toBe(120_000);
    // The code belongs to the *new* window, not the one that was expiring.
    expect(result.code).toBe(generateTotpCodeAt(totpConfig(), 90_000));
    expect(result.code).not.toBe(generateTotpCodeAt(totpConfig(), 89_000));
  });

  it("does not wait when exactly the threshold remains", async () => {
    const { clock, sleeps } = createFakeClock(88_000);

    const result = await generateFreshTotpCode(totpConfig(), clock, 2_000);

    expect(sleeps).toEqual([]);
    expect(result.code).toBe(generateTotpCodeAt(totpConfig(), 88_000));
  });

  it("honours a custom freshness threshold", async () => {
    const { clock, sleeps } = createFakeClock(80_000);

    // 10s left, but this caller wants 15s of headroom.
    const result = await generateFreshTotpCode(totpConfig(), clock, 15_000);

    expect(sleeps).toEqual([10_000]);
    expect(result.code).toBe(generateTotpCodeAt(totpConfig(), 90_000));
  });
});
