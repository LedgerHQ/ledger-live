import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import type { DomainCheckViolation } from "@ledgerhq/live-common/wallet-api/manifestDomainReport";
import { addAction } from "~/datadog/renderer";
import { webview } from "~/renderer/bridge";
import { reportBridgeSenderOrigin, startDomainCheckViolationReporting } from "./domainCheckReport";

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
    jest.mocked(addAction).mockClear();
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
  });

  describe("reportBridgeSenderOrigin", () => {
    it("reports a sender outside the strict manifest domains with its origin only", () => {
      reportBridgeSenderOrigin(manifest, "https://evil.com/swap?address=0xabc");

      expect(addAction).toHaveBeenCalledWith("live_app_domain_check_violation", {
        origin: "https://evil.com",
        manifestId: "swap",
        appVersion: "2.0.0",
        platform: "desktop",
        frameType: "main_frame",
        kind: "bridge",
        outcome: "would_block",
      });
    });

    it("does not report a sender on a listed origin", () => {
      reportBridgeSenderOrigin(manifest, "https://app.example.com/swap");

      expect(addAction).not.toHaveBeenCalled();
    });

    it("reports the same sender once", () => {
      reportBridgeSenderOrigin({ ...manifest, id: "earn" }, "https://other.com/a");
      reportBridgeSenderOrigin({ ...manifest, id: "earn" }, "https://other.com/b");

      expect(addAction).toHaveBeenCalledTimes(1);
    });
  });
});
