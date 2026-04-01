import { validateUrl } from "./learnUrlValidation";

jest.mock("~/renderer/logger", () => ({
  warn: jest.fn(),
}));

describe("validateUrl", () => {
  describe("allowed Ledger domains", () => {
    it.each([
      "https://support.ledger.com/",
      "https://support.ledger.com/es/article/4406882832401-zd",
      "https://developers.ledger.com/docs/clear-signing/for-dapps/get-started",
      "https://www.ledger.com/academy/what-is-web-30-everything-you-need-to-know",
    ])("should allow %s", url => {
      expect(validateUrl(url)).toBe(url);
    });
  });

  describe("allowed internal schemes", () => {
    it("should allow ledgerlive: URLs", () => {
      const url = "ledgerlive://earn?action=info-modal";
      expect(validateUrl(url)).toBe(url);
    });

    it("should allow ledgerwallet: URLs", () => {
      const url = "ledgerwallet://open";
      expect(validateUrl(url)).toBe(url);
    });
  });

  describe("blocked URLs", () => {
    it("should block non-allowlisted domains", () => {
      expect(validateUrl("https://example.com")).toBe("");
    });

    it("should block http protocol", () => {
      expect(validateUrl("http://ledger.com")).toBe("");
    });

    it("should block javascript: protocol", () => {
      expect(validateUrl("javascript:alert(1)")).toBe("");
    });

    it("should block malformed URLs", () => {
      expect(validateUrl("not-a-url")).toBe("");
    });

    it("should block empty string", () => {
      expect(validateUrl("")).toBe("");
    });

    it("should block domains that merely contain ledger.com", () => {
      expect(validateUrl("https://notledger.com")).toBe("");
      expect(validateUrl("https://ledger.com.evil.com")).toBe("");
    });
  });
});
