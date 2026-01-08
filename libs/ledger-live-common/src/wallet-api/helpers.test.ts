import { getInitialURL } from "./helpers";

describe("wallet-api helpers", () => {
  describe("isWhitelistedDomain (via getInitialURL)", () => {
    const mockManifest = {
      url: "https://default.example.com/",
      domains: ["ledger.com", "*.subdomain.ledger.com", "approved.io"],
    };

    describe("malicious URL bypass attempts", () => {
      it("should reject URL with whitelisted domain in query parameter", () => {
        const inputs = {
          goToURL: "https://evil.example/?next=ledger.com",
        };
        const result = getInitialURL(inputs, mockManifest);
        // Should fall back to manifest.url, not use goToURL
        expect(result).toBe(mockManifest.url);
      });

      it("should reject URL with whitelisted domain in hash fragment", () => {
        const inputs = {
          goToURL: "https://evil.example/#ledger.com",
        };
        const result = getInitialURL(inputs, mockManifest);
        expect(result).toBe(mockManifest.url);
      });

      it("should reject URL with whitelisted domain in path", () => {
        const inputs = {
          goToURL: "https://evil.example/ledger.com/redirect",
        };
        const result = getInitialURL(inputs, mockManifest);
        expect(result).toBe(mockManifest.url);
      });

      it("should reject URL with whitelisted domain as subdomain of malicious domain", () => {
        const inputs = {
          goToURL: "https://ledger.com.evil.example",
        };
        const result = getInitialURL(inputs, mockManifest);
        expect(result).toBe(mockManifest.url);
      });

      it("should reject URL with similar but different domain", () => {
        const inputs = {
          goToURL: "https://ledger.com.fake.io",
        };
        const result = getInitialURL(inputs, mockManifest);
        expect(result).toBe(mockManifest.url);
      });
    });

    describe("scheme validation", () => {
      it("should reject HTTP URLs", () => {
        const inputs = {
          goToURL: "http://ledger.com",
        };
        const result = getInitialURL(inputs, mockManifest);
        expect(result).toBe(mockManifest.url);
      });

      it("should reject javascript: URLs", () => {
        const inputs = {
          goToURL: "javascript:alert(1)",
        };
        const result = getInitialURL(inputs, mockManifest);
        expect(result).toBe(mockManifest.url);
      });

      it("should reject data: URLs", () => {
        const inputs = {
          goToURL: "data:text/html,<script>alert(1)</script>",
        };
        const result = getInitialURL(inputs, mockManifest);
        expect(result).toBe(mockManifest.url);
      });

      it("should reject file: URLs", () => {
        const inputs = {
          goToURL: "file:///etc/passwd",
        };
        const result = getInitialURL(inputs, mockManifest);
        expect(result).toBe(mockManifest.url);
      });

      it("should reject ftp: URLs", () => {
        const inputs = {
          goToURL: "ftp://ledger.com",
        };
        const result = getInitialURL(inputs, mockManifest);
        expect(result).toBe(mockManifest.url);
      });
    });

    describe("legitimate URLs", () => {
      it("should reject URL not on same domain as manifest", () => {
        const inputs = {
          goToURL: "https://ledger.com",
        };
        const result = getInitialURL(inputs, mockManifest);
        expect(result).toBe(mockManifest.url);
      });

      it("should reject URL with different domain even with path", () => {
        const inputs = {
          goToURL: "https://ledger.com/page?param=value",
        };
        const result = getInitialURL(inputs, mockManifest);
        expect(result).toBe(mockManifest.url);
      });

      it("should reject URL on different domain", () => {
        const inputs = {
          goToURL: "https://approved.io/some/path",
        };
        const result = getInitialURL(inputs, mockManifest);
        expect(result).toBe(mockManifest.url);
      });

      it("should allow URL on same domain as manifest URL", () => {
        const inputs = {
          goToURL: "https://default.example.com/different/path",
        };
        const result = getInitialURL(inputs, mockManifest);
        expect(result).toBe(inputs.goToURL);
      });

      it("should allow URL on same domain as manifest URL with different path and params", () => {
        const inputs = {
          goToURL: "https://default.example.com/page?test=value",
        };
        const result = getInitialURL(inputs, mockManifest);
        expect(result).toBe(inputs.goToURL);
      });

      it("should be case-insensitive for domain matching", () => {
        const inputs = {
          goToURL: "https://DEFAULT.EXAMPLE.COM/path",
        };
        const result = getInitialURL(inputs, mockManifest);
        expect(result).toBe(inputs.goToURL);
      });

      it("should allow URL on same domain with different case", () => {
        const manifestWithUppercase = {
          url: "https://default.example.com/",
          domains: ["LEDGER.COM"],
        };
        const inputs = {
          goToURL: "https://DEFAULT.EXAMPLE.COM/page",
        };
        const result = getInitialURL(inputs, manifestWithUppercase);
        expect(result).toBe(inputs.goToURL);
      });
    });

    describe("wildcard pattern matching", () => {
      it("should reject subdomain not matching manifest domain", () => {
        const inputs = {
          goToURL: "https://test.subdomain.ledger.com",
        };
        const result = getInitialURL(inputs, mockManifest);
        expect(result).toBe(mockManifest.url);
      });

      it("should reject nested subdomain not matching manifest domain", () => {
        const inputs = {
          goToURL: "https://a.b.subdomain.ledger.com",
        };
        const result = getInitialURL(inputs, mockManifest);
        expect(result).toBe(mockManifest.url);
      });

      it("should reject domain not matching manifest domain", () => {
        const inputs = {
          goToURL: "https://subdomain.ledger.com",
        };
        const result = getInitialURL(inputs, mockManifest);
        expect(result).toBe(mockManifest.url);
      });

      it("should reject subdomain not matching wildcard pattern", () => {
        const inputs = {
          goToURL: "https://test.wrong.ledger.com",
        };
        const result = getInitialURL(inputs, mockManifest);
        expect(result).toBe(mockManifest.url);
      });

      it("should reject when wildcard pattern should not match", () => {
        const inputs = {
          goToURL: "https://notsubdomain.ledger.com",
        };
        const result = getInitialURL(inputs, mockManifest);
        expect(result).toBe(mockManifest.url);
      });
    });

    describe("internationalized domain names", () => {
      it("should handle IDN domains (punycode) on same domain", () => {
        const manifestWithIDN = {
          url: "https://münchen.de/",
          domains: ["münchen.de"],
        };
        const inputs = {
          goToURL: "https://xn--mnchen-3ya.de/page", // punycode for münchen.de
        };
        const result = getInitialURL(inputs, manifestWithIDN);
        expect(result).toBe(inputs.goToURL);
      });

      it("should handle IDN domains in unicode form on same domain", () => {
        const manifestWithIDN = {
          url: "https://xn--mnchen-3ya.de/",
          domains: ["münchen.de"],
        };
        const inputs = {
          goToURL: "https://münchen.de/page",
        };
        const result = getInitialURL(inputs, manifestWithIDN);
        expect(result).toBe(inputs.goToURL);
      });
    });

    describe("edge cases", () => {
      it("should reject malformed URLs", () => {
        const inputs = {
          goToURL: "not-a-valid-url",
        };
        const result = getInitialURL(inputs, mockManifest);
        expect(result).toBe(mockManifest.url);
      });

      it("should reject empty URL", () => {
        const inputs = {
          goToURL: "",
        };
        const result = getInitialURL(inputs, mockManifest);
        expect(result).toBe(mockManifest.url);
      });

      it("should handle URL with port on same domain", () => {
        const inputs = {
          goToURL: "https://default.example.com:8080/path",
        };
        const result = getInitialURL(inputs, mockManifest);
        expect(result).toBe(inputs.goToURL);
      });

      it("should handle URL with authentication on same domain", () => {
        const inputs = {
          goToURL: "https://user:pass@default.example.com/path",
        };
        const result = getInitialURL(inputs, mockManifest);
        expect(result).toBe(inputs.goToURL);
      });

      it("should work when goToURL is not provided", () => {
        const inputs = {};
        const result = getInitialURL(inputs, mockManifest);
        expect(result).toBe(mockManifest.url);
      });

      it("should work when inputs is undefined", () => {
        const result = getInitialURL(undefined, mockManifest);
        expect(result).toBe(mockManifest.url);
      });

      it("should handle URL with only scheme separator", () => {
        const inputs = {
          goToURL: "https://",
        };
        const result = getInitialURL(inputs, mockManifest);
        expect(result).toBe(mockManifest.url);
      });
    });

    describe("deeplink attack scenario", () => {
      it("should block deeplink with malicious goToURL", () => {
        // Simulates: ledgerlive://discover/<appId>?goToURL=https://evil.example/?next=ledger.com
        const inputs = {
          goToURL: "https://evil.example/?next=ledger.com",
        };
        const result = getInitialURL(inputs, mockManifest);
        expect(result).toBe(mockManifest.url);
        expect(result).not.toContain("evil.example");
      });

      it("should allow deeplink with goToURL on same domain", () => {
        // Simulates: ledgerlive://discover/<appId>?goToURL=https://default.example.com/page
        const inputs = {
          goToURL: "https://default.example.com/page",
        };
        const result = getInitialURL(inputs, mockManifest);
        expect(result).toBe(inputs.goToURL);
        expect(result).toContain("default.example.com");
      });
    });

    describe("real-world manifest patterns", () => {
      it('should handle "https://" pattern (matches nothing with strict hostname validation)', () => {
        const manifestWithGenericPattern = {
          url: "https://default.example.com/",
          domains: ["https://"], // This pattern doesn't make sense with hostname validation
        };
        const inputs = {
          goToURL: "https://any.domain.com",
        };
        const result = getInitialURL(inputs, manifestWithGenericPattern);
        // Should reject because "https://" is not a valid hostname pattern
        expect(result).toBe(manifestWithGenericPattern.url);
      });

      it('should reject "*" pattern with non-HTTPS scheme', () => {
        const manifestWithHttpPattern = {
          url: "https://default.example.com/",
          domains: ["*"], // "*" is not a valid pattern
        };
        const inputs = {
          goToURL: "http://any.domain.com", // HTTP should be rejected
        };
        const result = getInitialURL(inputs, manifestWithHttpPattern);
        expect(result).toBe(manifestWithHttpPattern.url);
      });

      it('should reject "*" wildcard (all domains not allowed)', () => {
        const manifestWithWildcard = {
          url: "https://default.example.com/",
          domains: ["*"],
        };
        const inputs = {
          goToURL: "https://any.domain.com",
        };
        const result = getInitialURL(inputs, manifestWithWildcard);
        // "*" alone should not match any domain for security reasons
        expect(result).toBe(manifestWithWildcard.url);
      });
    });
  });

  describe("getInitialURL with manifest params", () => {
    it("should append params when goToURL is not provided", () => {
      const manifest = {
        url: "https://example.com",
        domains: ["example.com"],
        params: { foo: "bar" },
      };
      const inputs = { customParam: "value" };
      const result = getInitialURL(inputs, manifest);

      expect(result).toContain("example.com");
      expect(result).toContain("customParam=value");
      expect(result).toContain("params=%7B%22foo%22%3A%22bar%22%7D"); // JSON.stringify({foo: "bar"}) encoded
    });

    it("should use goToURL as-is when on same domain (without adding params)", () => {
      const manifest = {
        url: "https://example.com",
        domains: ["allowed.com"],
        params: { foo: "bar" },
      };
      const inputs = {
        goToURL: "https://example.com/page",
        customParam: "value",
      };
      const result = getInitialURL(inputs, manifest);

      expect(result).toBe("https://example.com/page");
      expect(result).not.toContain("customParam");
      expect(result).not.toContain("params");
    });
  });
});
