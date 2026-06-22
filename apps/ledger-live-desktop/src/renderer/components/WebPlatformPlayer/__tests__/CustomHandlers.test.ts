import { createDeeplinkOpenHandler } from "../CustomHandlers";
import { track } from "~/renderer/analytics/segment";

jest.mock("electron", () => ({
  ipcRenderer: {
    send: jest.fn(),
  },
}));

jest.mock("~/renderer/analytics/segment", () => ({
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
    const openDeepLink = jest.fn();
    const handler = createDeeplinkOpenHandler({
      isDeeplinkOpenHardeningEnabled: false,
      openDeepLink,
    });

    handler({ url: "file:///etc/passwd" });

    expect(openDeepLink).toHaveBeenCalledWith("file:///etc/passwd");
    expect(mockTrack).not.toHaveBeenCalled();
  });

  it.each(["file:///etc/passwd", "javascript:alert(1)", "smb://attacker/share", "itms-apps://app"])(
    "should block %s when hardening is enabled",
    url => {
      const openDeepLink = jest.fn();
      const handler = createDeeplinkOpenHandler({
        isDeeplinkOpenHardeningEnabled: true,
        openDeepLink,
      });

      handler({ url });

      expect(openDeepLink).not.toHaveBeenCalled();
      expect(mockTrack).toHaveBeenCalledWith("custom.deeplink.open blocked", {
        reason: "scheme",
      });
    },
  );

  it.each([
    "http://example.com",
    "https://example.com",
    "ledgerlive://swap",
    "ledgerwallet://settings",
    "mailto:support@ledger.com",
  ])("should forward %s when hardening is enabled", url => {
    const openDeepLink = jest.fn();
    const handler = createDeeplinkOpenHandler({
      isDeeplinkOpenHardeningEnabled: true,
      openDeepLink,
    });

    handler({ url });

    expect(openDeepLink).toHaveBeenCalledWith(url);
    expect(mockTrack).not.toHaveBeenCalled();
  });
});
