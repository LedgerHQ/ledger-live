import { describe, expect, it } from "@jest/globals";
import {
  BigNumberStrSchema,
  CurrencyIdSchema,
  DateTimeIsoSchema,
  HttpUrlSchema,
  NonEmptyStringSchema,
  SemVerSchema,
  TokenIdSchema,
} from "./string";

describe("CurrencyIdSchema", () => {
  it("accepts a non-empty string", () => {
    expect(CurrencyIdSchema.parse("bitcoin")).toBe("bitcoin");
  });
  it("rejects an empty string", () => {
    expect(() => CurrencyIdSchema.parse("")).toThrow();
  });
});

describe("TokenIdSchema", () => {
  it("accepts a non-empty string", () => {
    expect(TokenIdSchema.parse("ethereum/erc20/usd-tether")).toBe("ethereum/erc20/usd-tether");
  });
  it("rejects an empty string", () => {
    expect(() => TokenIdSchema.parse("")).toThrow();
  });
});

describe("BigNumberStrSchema", () => {
  it("accepts a decimal string", () => {
    expect(BigNumberStrSchema.parse("123456789")).toBe("123456789");
  });
  it("rejects an empty string", () => {
    expect(() => BigNumberStrSchema.parse("")).toThrow();
  });
});

describe("NonEmptyStringSchema", () => {
  it("accepts a non-empty string", () => {
    expect(NonEmptyStringSchema.parse("hello")).toBe("hello");
  });
  it("trims whitespace before validating", () => {
    expect(NonEmptyStringSchema.parse("  hi  ")).toBe("hi");
  });
  it("rejects an empty string", () => {
    expect(() => NonEmptyStringSchema.parse("")).toThrow();
  });
  it("rejects a whitespace-only string", () => {
    expect(() => NonEmptyStringSchema.parse("   ")).toThrow();
  });
});

describe("DateTimeIsoSchema", () => {
  it("accepts a Z-offset datetime", () => {
    expect(DateTimeIsoSchema.parse("2024-01-31T12:00:00Z")).toBe("2024-01-31T12:00:00Z");
  });
  it("accepts a +HH:mm offset datetime", () => {
    expect(DateTimeIsoSchema.parse("2024-01-31T12:00:00+05:30")).toBe("2024-01-31T12:00:00+05:30");
  });
  it("accepts fractional seconds", () => {
    expect(DateTimeIsoSchema.parse("2024-01-31T12:00:00.123Z")).toBe("2024-01-31T12:00:00.123Z");
  });
  it("rejects a date-only string", () => {
    expect(() => DateTimeIsoSchema.parse("2024-01-31")).toThrow();
  });
  it("rejects a datetime without offset", () => {
    expect(() => DateTimeIsoSchema.parse("2024-01-31T12:00:00")).toThrow();
  });
  it("rejects an annotated string (RFC 9557 bracket annotation)", () => {
    expect(() => DateTimeIsoSchema.parse("2024-01-31T12:00:00Z[Asia/Kolkata]")).toThrow();
  });
});

describe("HttpUrlSchema", () => {
  it("accepts an https URL", () => {
    expect(HttpUrlSchema.parse("https://example.com")).toBe("https://example.com");
  });
  it("accepts an http URL", () => {
    expect(HttpUrlSchema.parse("http://example.com")).toBe("http://example.com");
  });
  it("rejects a non-URL string", () => {
    expect(() => HttpUrlSchema.parse("not a url")).toThrow();
  });
  it("rejects a ftp URL", () => {
    expect(() => HttpUrlSchema.parse("ftp://example.com")).toThrow();
  });
});

describe("SemVerSchema", () => {
  it("accepts a simple version", () => {
    expect(SemVerSchema.parse("1.2.3")).toBe("1.2.3");
  });
  it("accepts a pre-release version", () => {
    expect(SemVerSchema.parse("1.0.0-alpha.1")).toBe("1.0.0-alpha.1");
  });
  it("rejects a partial version", () => {
    expect(() => SemVerSchema.parse("1.2")).toThrow();
  });
});
