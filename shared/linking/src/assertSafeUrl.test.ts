import { assertSafeUrl } from "./assertSafeUrl";

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
