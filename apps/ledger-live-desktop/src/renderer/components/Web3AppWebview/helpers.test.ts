import { renderHook } from "tests/testSetup";
import { useWebviewState } from "./helpers";
import { getInitialURL } from "@ledgerhq/live-common/wallet-api/helpers";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";

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

    it("remains stable when inputs gets a new object reference after mount", () => {
      // Regression test: when a parent re-renders (e.g. due to a Redux update like
      // lastSeenDevice), inputs may get a new object reference
      mockGetInitialURL
        .mockReturnValueOnce("https://example.com/?theme=dark&lang=en")
        .mockReturnValue("https://example.com/?theme=light&lang=fr"); // returned on subsequent calls

      const { result, rerender } = renderHook(
        (props: { inputs: Record<string, string> }) =>
          useWebviewState({ manifest: mockManifest, inputs: props.inputs }, null),
        { initialProps: { inputs: { theme: "dark", lang: "en" } } },
      );

      expect(result.current.webviewProps.src).toBe("https://example.com/?theme=dark&lang=en");

      // Simulate a parent re-render caused by a Redux update (e.g. lastSeenDevice).
      // inputs gets a new object reference — same values, different identity.
      rerender({ inputs: { theme: "dark", lang: "en" } });

      // The webview src must not change — no navigation should occur.
      expect(result.current.webviewProps.src).toBe("https://example.com/?theme=dark&lang=en");
    });

    it("remains stable even when inputs values change after mount", () => {
      // The initial URL is intentionally frozen at mount time. Inputs are query
      // parameters for the initial load; they are not a live binding to the webview.
      mockGetInitialURL
        .mockReturnValueOnce("https://example.com/?theme=dark")
        .mockReturnValue("https://example.com/?theme=light");

      const { result, rerender } = renderHook(
        (props: { inputs: Record<string, string> }) =>
          useWebviewState({ manifest: mockManifest, inputs: props.inputs }, null),
        { initialProps: { inputs: { theme: "dark" } } },
      );

      expect(result.current.webviewProps.src).toBe("https://example.com/?theme=dark");

      rerender({ inputs: { theme: "light" } });

      expect(result.current.webviewProps.src).toBe("https://example.com/?theme=dark");
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
});
