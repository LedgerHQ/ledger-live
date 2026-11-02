import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import type { DomainCheckViolation } from "@ledgerhq/live-common/wallet-api/manifestDomainReport";
import { log } from "@ledgerhq/logs";
import { addAction } from "~/datadog/renderer";
import { webview } from "~/renderer/bridge";
import {
  DOMAIN_CHECK_LOG_TYPE,
  reportBlockedInitialLoad,
  reportGoToURLFallback,
  reportRejectedLoadURL,
  startDomainCheckViolationReporting,
} from "./domainCheckReport";

jest.mock("~/datadog/renderer", () => ({
  addAction: jest.fn(),
}));

jest.mock("@ledgerhq/logs", () => ({
  log: jest.fn(),
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

    it("logs each distinct violation from main once, even when Datadog is not ready", () => {
      startDomainCheckViolationReporting();
      const [listener] = jest.mocked(webview.onDomainCheckViolation).mock.calls[0];
      const violation = { ...mainFrameViolation, manifestId: "sell" };
      jest.mocked(addAction).mockReturnValue(false);

      listener(violation);
      listener(violation);
      listener({ ...violation, origin: "https://other.com" });

      expect(log).toHaveBeenCalledTimes(2);
      expect(log).toHaveBeenCalledWith(DOMAIN_CHECK_LOG_TYPE, "violation", violation);
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

  describe("reportGoToURLFallback", () => {
    it("logs the rejected goToURL origin once, without sending it to Datadog", () => {
      reportGoToURLFallback("earn", "https://other.example.com/a?address=0xabc");
      reportGoToURLFallback("earn", "https://other.example.com/b");

      expect(log).toHaveBeenCalledTimes(1);
      expect(log).toHaveBeenCalledWith(
        DOMAIN_CHECK_LOG_TYPE,
        "goToURL rejected, loading manifest.url",
        expect.objectContaining({ origin: "https://other.example.com", manifestId: "earn" }),
      );
      expect(addAction).not.toHaveBeenCalled();
    });
  });

  describe("reportRejectedLoadURL", () => {
    it("logs the rejected URL origin once, without sending it to Datadog", () => {
      reportRejectedLoadURL("card", "https://evil.com/a");
      reportRejectedLoadURL("card", "https://evil.com/b");

      expect(log).toHaveBeenCalledTimes(1);
      expect(log).toHaveBeenCalledWith(
        DOMAIN_CHECK_LOG_TYPE,
        "loadURL rejected",
        expect.objectContaining({ origin: "https://evil.com", manifestId: "card" }),
      );
      expect(addAction).not.toHaveBeenCalled();
    });
  });
});
