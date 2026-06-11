import { act, renderHook } from "tests/testSetup";
import { useWebviewState } from "./helpers";
import { getInitialURL } from "@ledgerhq/live-common/wallet-api/helpers";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import type { WebviewTag } from "./types";

jest.mock("@ledgerhq/live-common/wallet-api/helpers", () => ({
  getInitialURL: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/wallet-api/manifestDomainUtils", () => ({
  isUrlAllowedByManifestDomains: jest.fn(() => true),
}));

jest.mock("@ledgerhq/live-common/wallet-api/react", () => ({
  safeGetRefValue: jest.fn(),
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

describe("useWebviewState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
