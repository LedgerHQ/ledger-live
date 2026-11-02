import { Platform } from "react-native";
import { DdRum, RumActionType } from "@datadog/mobile-react-native";

let mockIsDatadogRecording = true;

jest.mock("@datadog/mobile-react-native", () => ({
  DdRum: { addAction: jest.fn(() => Promise.resolve()) },
  RumActionType: { CUSTOM: "custom" },
}));

jest.mock("~/datadog", () => ({
  isDatadogRecording: () => mockIsDatadogRecording,
}));

jest.mock("LLM/utils/appVersion", () => ({ appVersion: "4.21.0" }));

const manifest = { id: "swap", domains: ["https://*", "https://app.example.com"] };

// The reporter keeps the violations it already sent: load a fresh copy per test.
const loadModule = (): typeof import("./domainCheckReport") => {
  let loaded: typeof import("./domainCheckReport") | undefined;
  jest.isolateModules(() => {
    loaded = require("./domainCheckReport");
  });
  if (!loaded) throw new Error("module not loaded");
  return loaded;
};

describe("mobile domainCheckReport", () => {
  beforeEach(() => {
    mockIsDatadogRecording = true;
    jest.mocked(DdRum.addAction).mockClear();
    Platform.OS = "ios";
  });

  it("sends a blocked navigation to Datadog with its origin only", () => {
    const { reportDomainCheckViolation } = loadModule();

    reportDomainCheckViolation({
      manifest,
      url: "https://evil.com/send?address=0xabc#frag",
      frameType: "main_frame",
      kind: "navigation",
      outcome: "blocked",
    });

    expect(DdRum.addAction).toHaveBeenCalledWith(
      RumActionType.CUSTOM,
      "live_app_domain_check_violation",
      {
        origin: "https://evil.com",
        manifestId: "swap",
        appVersion: "4.21.0",
        platform: "ios",
        frameType: "main_frame",
        kind: "navigation",
        outcome: "blocked",
      },
    );
  });

  it("tags Android reports", () => {
    Platform.OS = "android";
    const { reportDomainCheckViolation } = loadModule();

    reportDomainCheckViolation({
      manifest,
      url: "https://evil.com/",
      frameType: "main_frame",
      kind: "navigation",
      outcome: "blocked",
    });

    expect(jest.mocked(DdRum.addAction).mock.calls[0][2]).toMatchObject({ platform: "android" });
  });

  it("sends nothing while Datadog is not recording", () => {
    mockIsDatadogRecording = false;
    const { reportDomainCheckViolation } = loadModule();

    reportDomainCheckViolation({
      manifest,
      url: "https://evil.com/",
      frameType: "main_frame",
      kind: "navigation",
      outcome: "blocked",
    });

    expect(DdRum.addAction).not.toHaveBeenCalled();
  });

  it("sends a new occurrence once recording starts, without replaying earlier ones", () => {
    mockIsDatadogRecording = false;
    const { reportDomainCheckViolation } = loadModule();
    const event = {
      manifest,
      url: "https://evil.com/",
      frameType: "main_frame",
      kind: "navigation",
      outcome: "blocked",
    } as const;

    reportDomainCheckViolation(event);
    mockIsDatadogRecording = true;
    expect(DdRum.addAction).not.toHaveBeenCalled();

    reportDomainCheckViolation(event);
    reportDomainCheckViolation(event);

    expect(DdRum.addAction).toHaveBeenCalledTimes(1);
  });

  describe("reportDroppedBridgeMessage", () => {
    it.each([
      ["an unknown frame", undefined, "unknown"],
      ["the main frame", true, "main_frame"],
      ["a subframe", false, "sub_frame"],
    ] as const)("reports a message dropped from %s", (_name, isMainFrame, frameType) => {
      const { reportDroppedBridgeMessage } = loadModule();

      reportDroppedBridgeMessage(manifest, {
        url: "https://app.example.com/a?token=1",
        isMainFrame,
      });

      expect(jest.mocked(DdRum.addAction).mock.calls[0][2]).toMatchObject({
        origin: "https://app.example.com",
        kind: "bridge",
        frameType,
        outcome: "dropped",
      });
    });

    it("reports a sender without a URL as invalid, once", () => {
      const { reportDroppedBridgeMessage } = loadModule();

      reportDroppedBridgeMessage(manifest, { url: undefined, isMainFrame: undefined });
      reportDroppedBridgeMessage(manifest, { url: undefined, isMainFrame: undefined });

      expect(DdRum.addAction).toHaveBeenCalledTimes(1);
      expect(jest.mocked(DdRum.addAction).mock.calls[0][2]).toMatchObject({ origin: "invalid" });
    });
  });

  describe("reportIfStrictlyDisallowed", () => {
    it("reports a bridge sender outside the strict domains once", () => {
      const { reportIfStrictlyDisallowed } = loadModule();
      const event = { manifest, frameType: "unknown", kind: "bridge" } as const;

      reportIfStrictlyDisallowed({ ...event, url: "https://evil.com/a" });
      reportIfStrictlyDisallowed({ ...event, url: "https://evil.com/b" });

      expect(DdRum.addAction).toHaveBeenCalledTimes(1);
      expect(jest.mocked(DdRum.addAction).mock.calls[0][2]).toMatchObject({
        origin: "https://evil.com",
        kind: "bridge",
        frameType: "unknown",
        outcome: "would_block",
      });
    });

    it.each(["https://app.example.com/swap", "about:blank", ""])("does not report %j", url => {
      const { reportIfStrictlyDisallowed } = loadModule();

      reportIfStrictlyDisallowed({ manifest, url, frameType: "main_frame", kind: "navigation" });

      expect(DdRum.addAction).not.toHaveBeenCalled();
    });
  });
});
