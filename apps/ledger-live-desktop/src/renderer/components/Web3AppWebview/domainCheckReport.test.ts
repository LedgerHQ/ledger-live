import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import type { DomainCheckViolation } from "@ledgerhq/live-common/wallet-api/manifestDomainReport";
import { addAction } from "~/datadog/renderer";
import { webview } from "~/renderer/bridge";
import { reportBlockedInitialLoad, startDomainCheckViolationReporting } from "./domainCheckReport";

jest.mock("~/datadog/renderer", () => ({
  addAction: jest.fn(),
}));

const manifest = {
  id: "swap",
  domains: ["https://*", "https://app.example.com"],
} as LiveAppManifest;

const mainFrameViolation: DomainCheckViolation = {
  origin: "https://evil.com",
  manifestId: "swap",
  appVersion: "2.130.0",
  platform: "desktop",
  frameType: "main_frame",
  kind: "navigation",
  outcome: "blocked",
};

describe("domainCheckReport", () => {
  beforeEach(() => {
    jest.mocked(addAction).mockReset().mockReturnValue(true);
    jest.mocked(webview.onDomainCheckViolation).mockClear();
  });

  describe("startDomainCheckViolationReporting", () => {
    it("sends the violations from main to Datadog as a custom action", () => {
      const unsubscribe = jest.fn();
      jest.mocked(webview.onDomainCheckViolation).mockReturnValueOnce(unsubscribe);

      expect(startDomainCheckViolationReporting()).toBe(unsubscribe);
      const [listener] = jest.mocked(webview.onDomainCheckViolation).mock.calls[0];
      listener(mainFrameViolation);

      expect(addAction).toHaveBeenCalledWith("live_app_domain_check_violation", mainFrameViolation);
    });

    it("sends a violation from main again once Datadog accepts it, then once", () => {
      startDomainCheckViolationReporting();
      const [listener] = jest.mocked(webview.onDomainCheckViolation).mock.calls[0];
      const violation = { ...mainFrameViolation, manifestId: "buy" };
      jest.mocked(addAction).mockReturnValueOnce(false);

      listener(violation);
      listener(violation);
      listener(violation);

      expect(addAction).toHaveBeenCalledTimes(2);
    });
  });

  describe("reportBlockedInitialLoad", () => {
    it("reports a blocked main-frame navigation with its origin only", () => {
      reportBlockedInitialLoad({ ...manifest, domains: [] }, "https://app.example.com/a?b=c");

      expect(addAction).toHaveBeenCalledWith("live_app_domain_check_violation", {
        origin: "https://app.example.com",
        manifestId: "swap",
        appVersion: "2.0.0",
        platform: "desktop",
        frameType: "main_frame",
        kind: "navigation",
        outcome: "blocked",
      });
    });
  });
});
