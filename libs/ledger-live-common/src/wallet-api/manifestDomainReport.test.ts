import {
  createDomainCheckReporter,
  getReportableOrigin,
  getStrictManifestDomains,
  isUrlAllowedByStrictManifestDomains,
  type DomainCheckViolation,
} from "./manifestDomainReport";

const violation: DomainCheckViolation = {
  origin: "https://evil.com",
  manifestId: "swap",
  appVersion: "2.130.0",
  platform: "desktop",
  frameType: "main_frame",
  kind: "navigation",
  outcome: "would_block",
};

describe("manifestDomainReport", () => {
  describe("getStrictManifestDomains", () => {
    it("drops the entries that match any host", () => {
      expect(
        getStrictManifestDomains([
          "https://",
          "https://*",
          "http://",
          "http://*",
          "*",
          " https://* ",
          "https://app.example.com",
          "https://*.example.com",
        ]),
      ).toEqual(["https://app.example.com", "https://*.example.com"]);
    });

    it("returns an empty list for missing domains", () => {
      expect(getStrictManifestDomains(undefined)).toEqual([]);
    });
  });

  describe("isUrlAllowedByStrictManifestDomains", () => {
    it("rejects an origin only matched by an any-host entry", () => {
      expect(
        isUrlAllowedByStrictManifestDomains("https://evil.com/path", [
          "https://*",
          "https://app.example.com",
        ]),
      ).toBe(false);
    });

    it("accepts an origin listed explicitly", () => {
      expect(
        isUrlAllowedByStrictManifestDomains("https://app.example.com/path?x=1", [
          "https://*",
          "https://app.example.com",
        ]),
      ).toBe(true);
    });

    it("accepts a subdomain matched by a subdomain wildcard", () => {
      expect(
        isUrlAllowedByStrictManifestDomains("https://a.example.com", ["https://*.example.com"]),
      ).toBe(true);
    });
  });

  describe("getReportableOrigin", () => {
    it("keeps only the origin of an http(s) URL", () => {
      expect(
        getReportableOrigin("https://user:pass@app.example.com:8443/send?address=0xabc#frag"),
      ).toBe("https://app.example.com:8443");
    });

    it.each([
      ["about:blank", "about:"],
      ["data:text/html,<script>secret</script>", "data:"],
      ["ledgerlive://account?id=secret", "ledgerlive:"],
      ["blob:https://app.example.com/uuid", "blob:"],
    ])("reports only the scheme of %s", (url, expected) => {
      expect(getReportableOrigin(url)).toBe(expected);
    });

    it("reports an invalid URL without echoing it", () => {
      expect(getReportableOrigin("not a url ?token=secret")).toBe("invalid");
    });
  });

  describe("createDomainCheckReporter", () => {
    it("sends each distinct violation once", () => {
      const send = jest.fn();
      const report = createDomainCheckReporter(send);

      report(violation);
      report({ ...violation });
      report({ ...violation, outcome: "blocked" });
      report({ ...violation, kind: "bridge" });
      report({ ...violation, origin: "https://other.com" });
      report({ ...violation, manifestId: "earn" });

      expect(send).toHaveBeenCalledTimes(5);
      expect(send).toHaveBeenNthCalledWith(1, violation);
    });

    it("sends a violation again when the sender could not send it", () => {
      const send = jest.fn().mockReturnValueOnce(false).mockReturnValue(true);
      const report = createDomainCheckReporter(send);

      report(violation);
      report(violation);
      report(violation);

      expect(send).toHaveBeenCalledTimes(2);
    });

    it("stops sending once too many distinct violations were seen", () => {
      const send = jest.fn();
      const report = createDomainCheckReporter(send);

      for (let i = 0; i < 600; i++) {
        report({ ...violation, origin: `https://host${i}.com` });
      }

      expect(send).toHaveBeenCalledTimes(500);
    });
  });
});
