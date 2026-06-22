import { createDeeplinkOpenHandler } from "../CustomHandlers";
import { track } from "~/analytics";

jest.mock("~/analytics", () => ({
  track: jest.fn(),
}));

const mockTrack = jest.mocked(track);

describe("createDeeplinkOpenHandler", () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("should forward dangerous URLs when hardening is disabled", () => {
    const openURL = jest.fn();
    const handler = createDeeplinkOpenHandler({
      isDeeplinkOpenHardeningEnabled: false,
      isLocked: true,
      openURL,
    });

    handler({ url: "file:///etc/passwd" });

    expect(openURL).toHaveBeenCalledWith("file:///etc/passwd");
    expect(mockTrack).not.toHaveBeenCalled();
  });

  it.each(["file:///etc/passwd", "javascript:alert(1)", "smb://attacker/share", "itms-apps://app"])(
    "should block %s when hardening is enabled",
    url => {
      const openURL = jest.fn();
      const handler = createDeeplinkOpenHandler({
        isDeeplinkOpenHardeningEnabled: true,
        isLocked: false,
        openURL,
      });

      handler({ url });

      expect(openURL).not.toHaveBeenCalled();
      expect(mockTrack).toHaveBeenCalledWith("custom.deeplink.open blocked", {
        reason: "scheme",
      });
    },
  );

  it("should block safe URLs when hardening is enabled and app is locked", () => {
    const openURL = jest.fn();
    const handler = createDeeplinkOpenHandler({
      isDeeplinkOpenHardeningEnabled: true,
      isLocked: true,
      openURL,
    });

    handler({ url: "ledgerlive://swap" });

    expect(openURL).not.toHaveBeenCalled();
    expect(mockTrack).toHaveBeenCalledWith("custom.deeplink.open blocked", {
      reason: "locked",
    });
  });

  it.each([
    "http://example.com",
    "https://example.com",
    "ledgerlive://swap",
    "ledgerwallet://settings",
    "mailto:support@ledger.com",
  ])("should forward %s when hardening is enabled and app is unlocked", url => {
    const openURL = jest.fn();
    const handler = createDeeplinkOpenHandler({
      isDeeplinkOpenHardeningEnabled: true,
      isLocked: false,
      openURL,
    });

    handler({ url });

    expect(openURL).toHaveBeenCalledWith(url);
    expect(mockTrack).not.toHaveBeenCalled();
  });
});
