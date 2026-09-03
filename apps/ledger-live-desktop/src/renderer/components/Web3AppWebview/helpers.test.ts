import { act, renderHook } from "@testing-library/react";
import { getAttachedWebview, useWebviewState } from "./helpers";
import { getInitialURL } from "@ledgerhq/live-common/wallet-api/helpers";
import { track } from "~/renderer/analytics/segment";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import type { WebviewAPI, WebviewTag } from "./types";
import type { RefObject } from "react";

jest.mock("@ledgerhq/live-common/wallet-api/helpers", () => ({
  getInitialURL: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/wallet-api/manifestDomainUtils", () => ({
  isUrlAllowedByManifestDomains: jest.fn(() => true),
}));

jest.mock("@ledgerhq/live-common/wallet-api/react", () => ({
  useDAppManifestCurrencyIds: jest.fn(() => []),
}));

jest.mock("~/renderer/analytics/segment", () => ({
  track: jest.fn(),
}));

const mockManifest: LiveAppManifest = {
  id: "test-app",
  name: "Test App",
  private: false,
  url: "https://example.com",
  homepageUrl: "https://example.com",
  icon: "",
  platforms: ["desktop"],
  providerTestBaseUrl: "",
  providerTestId: "",
  apiVersion: "^2.0.0",
  manifestVersion: "2",
  branch: "stable",
  categories: [],
  currencies: "*",
  content: {
    shortDescription: { en: "Test" },
    description: { en: "Test" },
  },
  permissions: [],
  domains: ["https://example.com"],
  visibility: "complete",
};

const mockGetInitialURL = jest.mocked(getInitialURL);
const mockTrack = jest.mocked(track);

const createWebview = (getWebContentsId: () => number) =>
  ({
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    getWebContentsId,
    reload: jest.fn(),
    goBack: jest.fn(),
    goForward: jest.fn(),
    openDevTools: jest.fn(),
    clearHistory: jest.fn(),
    loadURL: jest.fn(() => Promise.resolve()),
  }) as unknown as WebviewTag;

describe("getAttachedWebview", () => {
  it("returns null when the ref holds no node", () => {
    expect(getAttachedWebview({ current: null })).toBeNull();
  });

  it("returns the node while its guest is attached", () => {
    const webview = createWebview(() => 42);

    expect(getAttachedWebview({ current: webview })).toBe(webview);
  });

  it("returns null once Electron dropped the guest", () => {
    const webview = createWebview(() => {
      throw new Error(
        "The WebView must be attached to the DOM and the dom-ready event emitted before this method can be called.",
      );
    });

    expect(getAttachedWebview({ current: webview })).toBeNull();
  });
});

describe("useWebviewState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTrack.mockClear();
  });

  describe("webviewProps.src", () => {
    it("is set to the URL returned by getInitialURL on mount", () => {
      mockGetInitialURL.mockReturnValue("https://example.com/?theme=dark");

      const { result } = renderHook(() => useWebviewState({ manifest: mockManifest }, null));

      expect(result.current.webviewProps.src).toBe("https://example.com/?theme=dark");
    });

    it("updates when inputs.goToURL changes (deeplink navigation)", () => {
      // When a live app is already open and the user taps a deeplink that targets
      // a different path in the same app (e.g. Baanx card top-up → card details),
      // the webview must navigate to the new URL
      mockGetInitialURL
        .mockReturnValueOnce("https://example.com/")
        .mockReturnValue("https://example.com/fund?accountId=123");

      const { result, rerender } = renderHook(
        (props: { inputs?: Record<string, string> }) =>
          useWebviewState({ manifest: mockManifest, inputs: props.inputs }, null),
        { initialProps: { inputs: undefined as Record<string, string> | undefined } },
      );

      expect(result.current.webviewProps.src).toBe("https://example.com/");

      rerender({ inputs: { goToURL: "https://example.com/fund?accountId=123" } });

      expect(result.current.webviewProps.src).toBe("https://example.com/fund?accountId=123");
    });

    it("updates when the manifest changes", () => {
      // When the manifest is swapped (e.g. the platform catalog refreshes live app
      // config from the server and a new manifest object is passed down), the webview
      // must navigate to the URL derived from the new manifest
      const updatedManifest: LiveAppManifest = {
        ...mockManifest,
        url: "https://new.example.com",
        domains: ["https://new.example.com"],
      };

      mockGetInitialURL
        .mockReturnValueOnce("https://example.com")
        .mockReturnValue("https://new.example.com");

      const { result, rerender } = renderHook(
        (props: { manifest: LiveAppManifest }) =>
          useWebviewState({ manifest: props.manifest }, null),
        { initialProps: { manifest: mockManifest } },
      );

      expect(result.current.webviewProps.src).toBe("https://example.com");

      rerender({ manifest: updatedManifest });

      expect(result.current.webviewProps.src).toBe("https://new.example.com");
    });
  });

  describe("webviewPartition", () => {
    it("is empty when manifest has no cacheBustingId", () => {
      mockGetInitialURL.mockReturnValue("https://example.com/");

      const { result } = renderHook(() => useWebviewState({ manifest: mockManifest }, null));

      expect(result.current.webviewPartition).toEqual({});
    });

    it("sets a persist partition keyed to manifest id and cacheBustingId", () => {
      const manifestWithCache: LiveAppManifest = {
        ...mockManifest,
        id: "my-app",
        cacheBustingId: 2,
      };
      mockGetInitialURL.mockReturnValue("https://example.com/");

      const { result } = renderHook(() => useWebviewState({ manifest: manifestWithCache }, null));

      expect(result.current.webviewPartition).toEqual({ partition: "persist:myapp-2" });
    });
  });

  describe("guest liveness guard", () => {
    const attached = () => createWebview(() => 42);
    const detached = () =>
      createWebview(() => {
        throw new Error(
          "The WebView must be attached to the DOM and the dom-ready event emitted before this method can be called.",
        );
      });

    const renderWithWebview = (webview: WebviewTag) => {
      mockGetInitialURL.mockReturnValue("https://example.com/");
      const webviewAPIRef: RefObject<WebviewAPI | null> = { current: null };

      const { result } = renderHook(() =>
        useWebviewState({ manifest: mockManifest }, webviewAPIRef),
      );

      act(() => {
        result.current.setWebviewRef(webview);
      });

      return { result, webviewAPIRef };
    };

    it("drives the webview while its guest is attached", async () => {
      const webview = attached();
      const { result, webviewAPIRef } = renderWithWebview(webview);

      webviewAPIRef.current?.reload();
      webviewAPIRef.current?.goBack();
      webviewAPIRef.current?.goForward();
      webviewAPIRef.current?.openDevTools();
      result.current.handleRefresh();
      await expect(
        webviewAPIRef.current?.loadURL("https://example.com/x"),
      ).resolves.toBeUndefined();

      expect(webview.reload).toHaveBeenCalledTimes(2);
      expect(webview.goBack).toHaveBeenCalledTimes(1);
      expect(webview.goForward).toHaveBeenCalledTimes(1);
      expect(webview.openDevTools).toHaveBeenCalledTimes(1);
      expect(webview.loadURL).toHaveBeenCalledWith("https://example.com/x");
    });

    it("no-ops instead of throwing once the element left the DOM", () => {
      // Electron drops the guest on detach, so every forwarded call throws. A top bar
      // button or the network error retry can still reach the node during teardown.
      const webview = detached();
      const { result, webviewAPIRef } = renderWithWebview(webview);

      expect(() => webviewAPIRef.current?.reload()).not.toThrow();
      expect(() => webviewAPIRef.current?.goBack()).not.toThrow();
      expect(() => webviewAPIRef.current?.goForward()).not.toThrow();
      expect(() => webviewAPIRef.current?.openDevTools()).not.toThrow();
      expect(() => webviewAPIRef.current?.clearHistory()).not.toThrow();
      expect(() => result.current.handleRefresh()).not.toThrow();

      expect(webview.reload).not.toHaveBeenCalled();
      expect(webview.goBack).not.toHaveBeenCalled();
      expect(webview.goForward).not.toHaveBeenCalled();
      expect(webview.openDevTools).not.toHaveBeenCalled();
      expect(webview.clearHistory).not.toHaveBeenCalled();
    });

    it("no-ops before the ref holds a node at all", async () => {
      mockGetInitialURL.mockReturnValue("https://example.com/");
      const webviewAPIRef: RefObject<WebviewAPI | null> = { current: null };

      const { result } = renderHook(() =>
        useWebviewState({ manifest: mockManifest }, webviewAPIRef),
      );

      expect(() => webviewAPIRef.current?.reload()).not.toThrow();
      expect(() => result.current.handleRefresh()).not.toThrow();
      await expect(webviewAPIRef.current?.loadURL("https://example.com/x")).rejects.toThrow(
        "Webview is not attached",
      );
    });

    it("rejects loadURL when detached so callers keep their fallback", async () => {
      const webview = detached();
      const { webviewAPIRef } = renderWithWebview(webview);

      await expect(webviewAPIRef.current?.loadURL("https://example.com/x")).rejects.toThrow(
        "Webview is not attached",
      );
      expect(webview.loadURL).not.toHaveBeenCalled();
    });
  });

  describe("setWebviewRef", () => {
    const webviewEvents = [
      "page-title-updated",
      "did-navigate",
      "did-navigate-in-page",
      "did-start-loading",
      "did-stop-loading",
      "dom-ready",
      "did-fail-load",
      "render-process-gone",
    ];

    it("should attach listeners when the webview node is set and detach them on cleanup", () => {
      mockGetInitialURL.mockReturnValue("https://example.com/");
      const addEventListener = jest.fn();
      const removeEventListener = jest.fn();
      const mockWebview = {
        addEventListener,
        removeEventListener,
      } as unknown as WebviewTag;

      const { result } = renderHook(() => useWebviewState({ manifest: mockManifest }, null));

      let cleanup: () => void = jest.fn();
      act(() => {
        cleanup = result.current.setWebviewRef(mockWebview);
      });

      expect(result.current.webviewRef.current).toBe(mockWebview);
      expect(addEventListener).toHaveBeenCalledTimes(webviewEvents.length);
      webviewEvents.forEach(eventName => {
        expect(addEventListener).toHaveBeenCalledWith(eventName, expect.any(Function));
      });

      act(() => {
        cleanup();
      });

      expect(result.current.webviewRef.current).toBeNull();
      expect(removeEventListener).toHaveBeenCalledTimes(webviewEvents.length);
      addEventListener.mock.calls.forEach(([eventName, handler]) => {
        expect(removeEventListener).toHaveBeenCalledWith(eventName, handler);
      });
    });
  });

  describe("handleFailLoad", () => {
    const setupWithWebview = () => {
      mockGetInitialURL.mockReturnValue("https://example.com/");
      const addEventListener = jest.fn();
      const mockWebview = {
        addEventListener,
        removeEventListener: jest.fn(),
        getWebContentsId: () => 42,
        reload: jest.fn(),
        goBack: jest.fn(),
        goForward: jest.fn(),
        openDevTools: jest.fn(),
        clearHistory: jest.fn(),
        loadURL: jest.fn(() => Promise.resolve()),
      } as unknown as WebviewTag;

      const { result } = renderHook(() => useWebviewState({ manifest: mockManifest }, null));
      act(() => {
        result.current.setWebviewRef(mockWebview);
      });

      const handler = addEventListener.mock.calls.find(
        ([event]: [string]) => event === "did-fail-load",
      )?.[1];

      return { result, handler };
    };

    it("ignores ERR_ABORTED (-3) without updating state or tracking", () => {
      const { result, handler } = setupWithWebview();

      act(() => {
        handler({
          errorCode: -3,
          errorDescription: "ERR_ABORTED",
          validatedURL: "https://example.com/",
          isMainFrame: true,
        });
      });

      expect(result.current.webviewState.isAppUnavailable).toBe(false);
      expect(mockTrack).not.toHaveBeenCalled();
    });

    it("sets isAppUnavailable and tracks when ERR_FAILED (-2) hits the main frame", () => {
      const { result, handler } = setupWithWebview();

      act(() => {
        handler({
          errorCode: -2,
          errorDescription: "ERR_FAILED",
          validatedURL: "https://example.com/",
          isMainFrame: true,
        });
      });

      expect(result.current.webviewState.isAppUnavailable).toBe(true);
      expect(mockTrack).toHaveBeenCalledWith("useWebviewState", {
        errorCode: -2,
        url: "example.com",
      });
    });

    it("does not set isAppUnavailable when ERR_FAILED (-2) is on a sub-frame", () => {
      const { result, handler } = setupWithWebview();

      act(() => {
        handler({
          errorCode: -2,
          errorDescription: "ERR_FAILED",
          validatedURL: "https://example.com/",
          isMainFrame: false,
        });
      });

      expect(result.current.webviewState.isAppUnavailable).toBe(false);
      expect(mockTrack).toHaveBeenCalled();
    });
  });
});
