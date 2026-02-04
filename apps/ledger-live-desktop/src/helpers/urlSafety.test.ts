import { isUrlSafe } from "./urlSafety";

describe("isUrlSafe", () => {
  describe("allowed protocols", () => {
    it("should return true for http URLs", () => {
      expect(isUrlSafe("http://example.com")).toBe(true);
      expect(isUrlSafe("http://ledger.com/support")).toBe(true);
      expect(isUrlSafe("http://localhost:3000")).toBe(true);
    });

    it("should return true for https URLs", () => {
      expect(isUrlSafe("https://example.com")).toBe(true);
      expect(isUrlSafe("https://ledger.com/support")).toBe(true);
      expect(isUrlSafe("https://api.example.com/v1/data?query=test")).toBe(true);
    });

    it("should return true for ledgerlive: URLs", () => {
      expect(isUrlSafe("ledgerlive://")).toBe(true);
      expect(isUrlSafe("ledgerlive://some-path")).toBe(true);
      expect(isUrlSafe("ledgerlive://request?params=value")).toBe(true);
    });

    it("should return true for ledgerwallet: URLs", () => {
      expect(isUrlSafe("ledgerwallet://")).toBe(true);
      expect(isUrlSafe("ledgerwallet://some-path")).toBe(true);
      expect(isUrlSafe("ledgerwallet://request?params=value")).toBe(true);
    });
  });

  describe("blocked protocols (RCE prevention)", () => {
    it("should return false for file:// URLs", () => {
      expect(isUrlSafe("file:///etc/passwd")).toBe(false);
      expect(isUrlSafe("file:///C:/Windows/System32/calc.exe")).toBe(false);
      expect(isUrlSafe("file:///System/Applications/Calculator.app")).toBe(false);
    });

    it("should return false for smb:// URLs (NTLM hash theft)", () => {
      expect(isUrlSafe("smb://attacker.com/share")).toBe(false);
      expect(isUrlSafe("smb://192.168.1.1/folder")).toBe(false);
    });

    it("should return false for other dangerous protocols", () => {
      expect(isUrlSafe("javascript:alert(1)")).toBe(false);
      expect(isUrlSafe("data:text/html,<script>alert(1)</script>")).toBe(false);
      expect(isUrlSafe("vbscript:msgbox(1)")).toBe(false);
      expect(isUrlSafe("ftp://files.example.com")).toBe(false);
      expect(isUrlSafe("ssh://user@server.com")).toBe(false);
      expect(isUrlSafe("telnet://server.com")).toBe(false);
    });

    it("should return false for application protocol handlers", () => {
      expect(isUrlSafe("ms-msdt://id")).toBe(false);
      expect(isUrlSafe("ms-excel://open")).toBe(false);
      expect(isUrlSafe("zoommtg://zoom.us/join")).toBe(false);
      expect(isUrlSafe("slack://open")).toBe(false);
    });
  });

  describe("invalid URLs", () => {
    it("should return false for invalid URLs", () => {
      expect(isUrlSafe("not-a-url")).toBe(false);
      expect(isUrlSafe("")).toBe(false);
      expect(isUrlSafe("://missing-protocol.com")).toBe(false);
    });

    it("should return false for malformed URLs", () => {
      expect(isUrlSafe("http://")).toBe(false);
      expect(isUrlSafe("https://")).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle URLs with authentication", () => {
      expect(isUrlSafe("https://user:pass@example.com")).toBe(true);
    });

    it("should handle URLs with ports", () => {
      expect(isUrlSafe("https://example.com:8443")).toBe(true);
    });

    it("should handle URLs with fragments and query strings", () => {
      expect(isUrlSafe("https://example.com/page#section")).toBe(true);
      expect(isUrlSafe("https://example.com/search?q=test&page=1")).toBe(true);
    });

    it("should be case-insensitive for protocols", () => {
      expect(isUrlSafe("HTTP://example.com")).toBe(true);
      expect(isUrlSafe("HTTPS://example.com")).toBe(true);
      expect(isUrlSafe("FILE:///etc/passwd")).toBe(false);
    });
  });
});
