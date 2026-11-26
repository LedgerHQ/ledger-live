import { assertSafeUrl, isSafeUrl } from "./assertSafeUrl";

describe("assertSafeUrl", () => {
  it("allows https URLs", () => {
    expect(() => assertSafeUrl("https://support.ledger.com")).not.toThrow();
  });

  it("allows mailto URLs", () => {
    expect(() => assertSafeUrl("mailto:support@ledger.com")).not.toThrow();
  });

  it("blocks http URLs", () => {
    expect(() => assertSafeUrl("http://example.com")).toThrow("Blocked unsafe protocol");
  });

  it("blocks javascript protocol", () => {
    expect(() => assertSafeUrl("javascript:alert(1)")).toThrow("Blocked unsafe protocol");
  });

  it("blocks file protocol", () => {
    expect(() => assertSafeUrl("file:///etc/passwd")).toThrow("Blocked unsafe protocol");
  });

  it("throws on invalid URLs", () => {
    expect(() => assertSafeUrl("not-a-url")).toThrow("Invalid URL");
  });

  it("throws on empty string", () => {
    expect(() => assertSafeUrl("")).toThrow("Invalid URL");
  });
});

describe("isSafeUrl", () => {
  it("accepts the URLs the opener accepts", () => {
    expect(isSafeUrl("https://support.ledger.com")).toBe(true);
    expect(isSafeUrl("mailto:support@ledger.com")).toBe(true);
  });

  it("rejects the others without throwing", () => {
    expect(isSafeUrl("http://support.ledger.com")).toBe(false);
    expect(isSafeUrl("not-a-url")).toBe(false);
  });
});
