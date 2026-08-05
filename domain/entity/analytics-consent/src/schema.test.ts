import {
  analyticsConsentInfoSchema,
  comparePolicyVersions,
  parseConsentDate,
  parsePolicyVersion,
  parseStoredPolicyVersion,
  type PolicyVersion,
} from "./schema";
import { mockAnalyticsConsentInfo } from "./schema.mock";

describe("parsePolicyVersion", () => {
  it.each([
    { value: 1, expected: { major: 1, minor: 0, normalized: "1.0" } },
    { value: "1", expected: { major: 1, minor: 0, normalized: "1.0" } },
    { value: "1.0", expected: { major: 1, minor: 0, normalized: "1.0" } },
    { value: "1.2", expected: { major: 1, minor: 2, normalized: "1.2" } },
    { value: "2", expected: { major: 2, minor: 0, normalized: "2.0" } },
    { value: "2.10", expected: { major: 2, minor: 10, normalized: "2.10" } },
    { value: 20260531, expected: { major: 20260531, minor: 0, normalized: "20260531.0" } },
  ])("reads $value as $expected.normalized", ({ value, expected }) => {
    expect(parsePolicyVersion(value)).toEqual(expected);
  });

  it.each([
    { value: 1.2 },
    { value: 0 },
    { value: -1 },
    { value: "01.2" },
    { value: "1.02" },
    { value: "1.2.3" },
    { value: "v1.2" },
    { value: "0.1" },
    { value: "1." },
    { value: ".1" },
    { value: "" },
    { value: " 1.2 " },
    { value: null },
    { value: undefined },
    { value: {} },
    { value: true },
    { value: Number.NaN },
    { value: Number.POSITIVE_INFINITY },
  ])("rejects $value", ({ value }) => {
    expect(parsePolicyVersion(value)).toBeNull();
  });
});

describe("parseStoredPolicyVersion", () => {
  it.each([
    { value: 1.4, expected: { major: 1, minor: 4, normalized: "1.4" } },
    { value: 2.1, expected: { major: 2, minor: 1, normalized: "2.1" } },
  ])("reads the coerced float $value as $expected.normalized", ({ value, expected }) => {
    expect(parseStoredPolicyVersion(value)).toEqual(expected);
  });

  it.each([
    { value: "1.4", expected: { major: 1, minor: 4, normalized: "1.4" } },
    { value: 1, expected: { major: 1, minor: 0, normalized: "1.0" } },
  ])("still reads $value written by a current client", ({ value, expected }) => {
    expect(parseStoredPolicyVersion(value)).toEqual(expected);
  });

  it.each([{ value: 0 }, { value: -1.4 }, { value: 1e21 }, { value: Number.NaN }, { value: null }])(
    "rejects $value",
    ({ value }) => {
      expect(parseStoredPolicyVersion(value)).toBeNull();
    },
  );
});

describe("comparePolicyVersions", () => {
  const version = (value: string): PolicyVersion => {
    const parsed = parsePolicyVersion(value);
    if (!parsed) throw new Error(`unparseable test version ${value}`);
    return parsed;
  };

  it("orders by major before minor", () => {
    expect(comparePolicyVersions(version("1.9"), version("2.0"))).toBeLessThan(0);
    expect(comparePolicyVersions(version("2.0"), version("1.9"))).toBeGreaterThan(0);
  });

  it("compares minor numerically rather than lexicographically", () => {
    expect(comparePolicyVersions(version("2.9"), version("2.10"))).toBeLessThan(0);
  });

  it("treats an implicit minor as zero", () => {
    expect(comparePolicyVersions(version("2"), version("2.0"))).toBe(0);
  });
});

describe("parseConsentDate", () => {
  it("reads what the app writes", () => {
    const written = new Date("2026-01-31T12:00:00.123Z").toISOString();
    expect(parseConsentDate(written)?.toISOString()).toBe(written);
  });

  it.each([
    { value: "2026-01-31T12:00:00Z" },
    { value: "2026-01-31T12:00:00+05:30" },
    { value: "2026-01-31T12:00:00.123Z" },
  ])("accepts the RFC 3339 instant $value", ({ value }) => {
    expect(parseConsentDate(value)).toEqual(new Date(value));
  });

  it.each([
    { value: "Jan 15, 2026" },
    { value: "2026-1-5" },
    { value: "2026/01/31" },
    { value: "2026-01-31" },
    { value: "2026-01-31T12:00:00" },
    { value: "" },
    { value: null },
    { value: undefined },
    { value: 1_769_860_800_000 },
  ])("rejects $value", ({ value }) => {
    expect(parseConsentDate(value)).toBeNull();
  });
});

describe("analyticsConsentInfoSchema", () => {
  it.each([
    mockAnalyticsConsentInfo(),
    mockAnalyticsConsentInfo({ consentDate: "2026-01-01T00:00:00.000Z", privacyPolicyVersion: 1 }),
    mockAnalyticsConsentInfo({
      consentDate: "2026-01-01T00:00:00.000Z",
      privacyPolicyVersion: "2.1",
    }),
  ])("accepts stored consent %p", info => {
    expect(analyticsConsentInfoSchema.parse(info)).toEqual(info);
  });

  it("rejects a consent date that is not a string", () => {
    expect(() =>
      analyticsConsentInfoSchema.parse({ consentDate: 0, privacyPolicyVersion: 1 }),
    ).toThrow();
  });
});
