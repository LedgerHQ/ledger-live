import { isSameDomain, applyCustomDappUrl } from "./manifestDomainUtils";

describe("manifestDomainUtils", () => {
  describe("isSameDomain", () => {
    it("should return true for same domains and protocols", () => {
      expect(isSameDomain("https://example.com/path1", "https://example.com/path2")).toBe(true);
    });

    it("should return false for same domains with different protocols", () => {
      expect(isSameDomain("http://example.com/path1", "https://example.com/path2")).toBe(false);
    });

    it("should return true for same domains and protocols with different ports", () => {
      expect(isSameDomain("https://example.com:3000/path1", "https://example.com:8080/path2")).toBe(
        true,
      );
    });

    it("should return true for same domains and protocols with different query params", () => {
      expect(isSameDomain("https://example.com/path?a=1", "https://example.com/path?b=2")).toBe(
        true,
      );
    });

    it("should return true for same domains and protocols with different paths", () => {
      expect(isSameDomain("https://example.com/path1", "https://example.com/path2")).toBe(true);
    });

    it("should return true for same domains and protocols with different hashes", () => {
      expect(
        isSameDomain("https://example.com/path#section1", "https://example.com/path#section2"),
      ).toBe(true);
    });

    it("should return false for different domains", () => {
      expect(isSameDomain("https://example.com/path", "https://other.com/path")).toBe(false);
    });

    it("should return true for different subdomains (same base domain)", () => {
      expect(isSameDomain("https://app.example.com/path", "https://api.example.com/path")).toBe(
        true,
      );
    });

    it("should return true for subdomain and base domain", () => {
      expect(isSameDomain("https://example.com/path", "https://app.example.com/path")).toBe(true);
    });

    it("should return true for www subdomain and base domain", () => {
      expect(isSameDomain("https://www.example.com/path", "https://example.com/path")).toBe(true);
    });

    it("should return true for multiple levels of subdomains", () => {
      expect(
        isSameDomain(
          "https://api.staging.example.com/path",
          "https://app.production.example.com/path",
        ),
      ).toBe(true);
    });

    it("should return true for .co.uk domains with different subdomains", () => {
      expect(isSameDomain("https://app.example.co.uk/path", "https://api.example.co.uk/path")).toBe(
        true,
      );
    });

    it("should return true for .co.uk subdomain and base domain", () => {
      expect(isSameDomain("https://example.co.uk/path", "https://www.example.co.uk/path")).toBe(
        true,
      );
    });

    it("should return false for different .co.uk base domains", () => {
      expect(isSameDomain("https://example.co.uk/path", "https://other.co.uk/path")).toBe(false);
    });

    it("should return false for http vs https", () => {
      expect(isSameDomain("http://example.com/path", "https://example.com/path")).toBe(false);
    });

    it("should return false for https vs http", () => {
      expect(isSameDomain("https://example.com/path", "http://example.com/path")).toBe(false);
    });

    it("should return false when first URL is undefined", () => {
      expect(isSameDomain(undefined, "https://example.com/path")).toBe(false);
    });

    it("should return false when second URL is undefined", () => {
      expect(isSameDomain("https://example.com/path", undefined)).toBe(false);
    });

    it("should return false when both URLs are undefined", () => {
      expect(isSameDomain(undefined, undefined)).toBe(false);
    });

    it("should return false when first URL is invalid", () => {
      expect(isSameDomain("not-a-url", "https://example.com/path")).toBe(false);
    });

    it("should return false when second URL is invalid", () => {
      expect(isSameDomain("https://example.com/path", "not-a-url")).toBe(false);
    });

    it("should return false when both URLs are invalid", () => {
      expect(isSameDomain("not-a-url", "not-a-url")).toBe(false);
    });

    it("should return false for localhost URLs", () => {
      expect(isSameDomain("http://localhost:3000", "http://localhost:8080")).toBe(false);
    });

    it("should return false for IP address URLs", () => {
      expect(isSameDomain("http://192.168.1.1", "http://192.168.1.2")).toBe(false);
    });
  });

  describe("applyCustomDappUrl", () => {
    describe("manifest with params.dappUrl", () => {
      it("should apply customDappUrl when domains match", () => {
        const manifest = {
          id: "app1",
          params: {
            dappUrl: "https://example.com/original",
            otherParam: "value",
          },
        };

        // @ts-expect-error - test mock object doesn't have all LiveAppManifest properties
        const result = applyCustomDappUrl(manifest, "https://example.com/custom");

        expect(result).toEqual({
          id: "app1",
          params: {
            dappUrl: "https://example.com/custom",
            otherParam: "value",
          },
        });
      });

      it("should not apply customDappUrl when domains do not match", () => {
        const manifest = {
          id: "app1",
          params: {
            dappUrl: "https://example.com/original",
            otherParam: "value",
          },
        };

        // @ts-expect-error - test mock object doesn't have all LiveAppManifest properties
        const result = applyCustomDappUrl(manifest, "https://malicious.com/custom");

        expect(result).toEqual(manifest);
        expect(result).toBe(manifest); // Should return same reference
      });

      it("should apply customDappUrl when subdomain differs but base domain matches", () => {
        const manifest = {
          id: "app1",
          params: {
            dappUrl: "https://app.example.com/original",
          },
        };

        // @ts-expect-error - test mock object doesn't have all LiveAppManifest properties
        const result = applyCustomDappUrl(manifest, "https://api.example.com/custom");

        expect(result).toEqual({
          id: "app1",
          params: {
            dappUrl: "https://api.example.com/custom",
          },
        });
      });

      it("should apply customDappUrl from subdomain to base domain", () => {
        const manifest = {
          id: "app1",
          params: {
            dappUrl: "https://app.example.com/original",
          },
        };

        // @ts-expect-error - test mock object doesn't have all LiveAppManifest properties
        const result = applyCustomDappUrl(manifest, "https://example.com/custom");

        expect(result).toEqual({
          id: "app1",
          params: {
            dappUrl: "https://example.com/custom",
          },
        });
      });

      it("should apply customDappUrl from base domain to subdomain", () => {
        const manifest = {
          id: "app1",
          params: {
            dappUrl: "https://example.com/original",
          },
        };

        // @ts-expect-error - test mock object doesn't have all LiveAppManifest properties
        const result = applyCustomDappUrl(manifest, "https://www.example.com/custom");

        expect(result).toEqual({
          id: "app1",
          params: {
            dappUrl: "https://www.example.com/custom",
          },
        });
      });

      it("should not apply customDappUrl when protocol differs", () => {
        const manifest = {
          id: "app1",
          params: {
            dappUrl: "https://example.com/original",
          },
        };

        // @ts-expect-error - test mock object doesn't have all LiveAppManifest properties
        const result = applyCustomDappUrl(manifest, "http://example.com/custom");

        expect(result).toBe(manifest);
      });
    });

    describe("manifest with dapp flag and url", () => {
      it("should apply customDappUrl when domains match", () => {
        const manifest = {
          id: "app1",
          dapp: true,
          url: "https://example.com/original",
          name: "My App",
        };

        // @ts-expect-error - test mock object doesn't have all LiveAppManifest properties
        const result = applyCustomDappUrl(manifest, "https://example.com/custom");

        expect(result).toEqual({
          id: "app1",
          dapp: true,
          url: "https://example.com/custom",
          name: "My App",
        });
      });

      it("should not apply customDappUrl when domains do not match", () => {
        const manifest = {
          id: "app1",
          dapp: true,
          url: "https://example.com/original",
          name: "My App",
        };

        // @ts-expect-error - test mock object doesn't have all LiveAppManifest properties
        const result = applyCustomDappUrl(manifest, "https://malicious.com/custom");

        expect(result).toEqual(manifest);
        expect(result).toBe(manifest);
      });

      it("should not apply customDappUrl when protocol differs", () => {
        const manifest = {
          id: "app1",
          dapp: true,
          url: "https://example.com/original",
          name: "My App",
        };

        // @ts-expect-error - test mock object doesn't have all LiveAppManifest properties
        const result = applyCustomDappUrl(manifest, "http://example.com/custom");

        expect(result).toEqual(manifest);
        expect(result).toBe(manifest);
      });
    });

    describe("edge cases", () => {
      it("should return null when manifest is null", () => {
        expect(applyCustomDappUrl(null, "https://example.com/custom")).toBe(null);
      });

      it("should return undefined when manifest is undefined", () => {
        expect(applyCustomDappUrl(undefined, "https://example.com/custom")).toBe(undefined);
      });

      it("should return manifest when customDappUrl is null", () => {
        const manifest = {
          id: "app1",
          params: { dappUrl: "https://example.com/original" },
        };

        // @ts-expect-error - test mock object doesn't have all LiveAppManifest properties
        expect(applyCustomDappUrl(manifest, null)).toBe(manifest);
      });

      it("should return manifest when customDappUrl is undefined", () => {
        const manifest = {
          id: "app1",
          params: { dappUrl: "https://example.com/original" },
        };

        // @ts-expect-error - test mock object doesn't have all LiveAppManifest properties
        expect(applyCustomDappUrl(manifest, undefined)).toBe(manifest);
      });

      it("should return manifest when customDappUrl is empty string", () => {
        const manifest = {
          id: "app1",
          params: { dappUrl: "https://example.com/original" },
        };

        // @ts-expect-error - test mock object doesn't have all LiveAppManifest properties
        expect(applyCustomDappUrl(manifest, "")).toBe(manifest);
      });

      it("should return manifest when it has no params or dapp", () => {
        const manifest = {
          id: "app1",
          name: "My App",
        };

        // @ts-expect-error - test mock object doesn't have all LiveAppManifest properties
        expect(applyCustomDappUrl(manifest, "https://example.com/custom")).toBe(manifest);
      });

      it("should return manifest when params exists but has no dappUrl", () => {
        const manifest = {
          id: "app1",
          params: { otherParam: "value" },
        };

        // @ts-expect-error - test mock object doesn't have all LiveAppManifest properties
        expect(applyCustomDappUrl(manifest, "https://example.com/custom")).toBe(manifest);
      });

      it("should return manifest when dapp is true but no url property", () => {
        const manifest = {
          id: "app1",
          dapp: true,
          name: "My App",
        };

        // @ts-expect-error - test mock object doesn't have all LiveAppManifest properties
        expect(applyCustomDappUrl(manifest, "https://example.com/custom")).toBe(manifest);
      });

      it("should prioritize params.dappUrl over manifest.url when both exist", () => {
        const manifest = {
          id: "app1",
          params: {
            dappUrl: "https://example.com/original",
          },
          dapp: true,
          url: "https://example.com/fallback",
        };

        // @ts-expect-error - test mock object doesn't have all LiveAppManifest properties
        const result = applyCustomDappUrl(manifest, "https://example.com/custom");

        expect(result).toEqual({
          id: "app1",
          params: {
            dappUrl: "https://example.com/custom",
          },
          dapp: true,
          url: "https://example.com/fallback",
        });
      });
    });
  });
});
