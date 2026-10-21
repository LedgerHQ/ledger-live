import { Linking } from "react-native";
import type { ShouldStartLoadRequestEvent } from "react-native-webview/lib/WebViewTypes";
import type * as WebViewShared from "react-native-webview/lib/WebViewShared";
import {
  MANIFEST_DOMAIN_CHECK_ORIGIN_WHITELIST,
  isExternallyOpenableUrl,
  openWindowExternally,
  shouldStartLoadWithManifestDomains,
} from "./manifestDomainGuard";

// The patched library source (the "react-native" entry Metro bundles), not the global jest mock
// nor the unpatched compiled lib/.
const { createOnShouldStartLoadWithRequest } = jest.requireActual<typeof WebViewShared>(
  "react-native-webview/src/WebViewShared",
);

const DOMAINS = ["https://app.example.com", "https://*.partner.com"];

function shouldStartEvent(
  url: string,
  isTopFrame: boolean | undefined,
  lockIdentifier = 42,
): ShouldStartLoadRequestEvent {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return {
    nativeEvent: {
      url,
      isTopFrame,
      lockIdentifier,
      loading: true,
      title: "",
      canGoBack: false,
      canGoForward: false,
      navigationType: "other",
    },
  } as unknown as ShouldStartLoadRequestEvent;
}

/**
 * Runs a navigation through the same pipeline as the native webview: the library's originWhitelist
 * check, then our onShouldStartLoadWithRequest. `loadRequest` is what tells the native side to
 * cancel (false) or continue (true).
 */
function decide(url: string, isTopFrame: boolean | undefined) {
  const loadRequest = jest.fn();
  createOnShouldStartLoadWithRequest(loadRequest, MANIFEST_DOMAIN_CHECK_ORIGIN_WHITELIST, request =>
    shouldStartLoadWithManifestDomains(request, DOMAINS),
  )(shouldStartEvent(url, isTopFrame));
  expect(loadRequest).toHaveBeenCalledTimes(1);
  expect(loadRequest).toHaveBeenCalledWith(expect.any(Boolean), url, 42);
  return loadRequest.mock.calls[0][0];
}

describe("manifest domain check navigation pipeline", () => {
  let openURL: jest.SpyInstance;
  let canOpenURL: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    canOpenURL = jest.spyOn(Linking, "canOpenURL").mockResolvedValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("continues a main-frame load on an origin listed in manifest.domains", () => {
    expect(decide("https://app.example.com/swap?x=1", true)).toBe(true);
    expect(decide("https://eu.partner.com/kyc", true)).toBe(true);
  });

  it("cancels a main-frame load outside manifest.domains", () => {
    expect(decide("https://evil.com/", true)).toBe(false);
    expect(decide("https://partner.com/", true)).toBe(false);
  });

  it("cancels an origin that only shares a prefix with an allowed origin", () => {
    expect(decide("https://app.example.com.evil.com/", true)).toBe(false);
    expect(decide("https://app.example.com:8443/", true)).toBe(false);
  });

  it("cancels an http main-frame load", () => {
    expect(decide("http://app.example.com/", true)).toBe(false);
  });

  it("cancels a main-frame load when the platform does not report the frame", () => {
    expect(decide("https://evil.com/", undefined)).toBe(false);
  });

  it("cancels non-http(s) main-frame loads", () => {
    expect(decide("about:blank", true)).toBe(false);
    expect(decide("javascript:alert(1)", true)).toBe(false);
    expect(decide("file:///etc/hosts", true)).toBe(false);
  });

  it("hands a main-frame Ledger deeplink to Linking without loading it", () => {
    expect(decide("ledgerlive://swap?from=bitcoin", true)).toBe(false);
    expect(decide("ledgerwallet://account", true)).toBe(false);

    expect(openURL).toHaveBeenCalledWith("ledgerlive://swap?from=bitcoin");
    expect(openURL).toHaveBeenCalledWith("ledgerwallet://account");
    expect(canOpenURL).not.toHaveBeenCalled();
  });

  it("does not let a subframe trigger a Ledger deeplink", () => {
    expect(decide("ledgerlive://swap", false)).toBe(false);
    expect(openURL).not.toHaveBeenCalled();
  });

  it("lets https subframes from any origin load (3-D Secure, KYC)", () => {
    expect(decide("https://acs.bank.com/3ds", false)).toBe(true);
  });

  it("lets about:, blob: and data: subframes load", () => {
    expect(decide("about:srcdoc", false)).toBe(true);
    expect(decide("about:blank", false)).toBe(true);
    expect(decide("blob:https://app.example.com/0b9f6f1c", false)).toBe(true);
    expect(decide("data:text/html,<p>hi</p>", false)).toBe(true);
    expect(canOpenURL).not.toHaveBeenCalled();
  });

  it("cancels http subframes", () => {
    expect(decide("http://tracker.com/pixel", false)).toBe(false);
  });
});

describe("openWindowExternally", () => {
  let openURL: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each(["https://ledger.com/support", "ledgerlive://buy", "ledgerwallet://swap"])(
    "opens %s when restricted",
    url => {
      openWindowExternally(url, true);
      expect(openURL).toHaveBeenCalledWith(url);
    },
  );

  it.each([
    "http://ledger.com",
    "javascript:alert(1)",
    "file:///etc/hosts",
    "intent://scan#Intent;scheme=zxing;end",
    "tel:+33100000000",
    "not a url",
  ])("refuses %s when restricted", url => {
    openWindowExternally(url, true);
    expect(openURL).not.toHaveBeenCalled();
  });

  it("keeps opening any URL when not restricted (flag off)", () => {
    openWindowExternally("http://ledger.com", false);
    expect(openURL).toHaveBeenCalledWith("http://ledger.com");
  });
});

describe("isExternallyOpenableUrl", () => {
  it("only accepts https and Ledger schemes", () => {
    expect(isExternallyOpenableUrl("https://a.com")).toBe(true);
    expect(isExternallyOpenableUrl("ledgerlive://x")).toBe(true);
    expect(isExternallyOpenableUrl("HTTP://a.com")).toBe(false);
    expect(isExternallyOpenableUrl("mailto:a@b.c")).toBe(false);
  });
});
