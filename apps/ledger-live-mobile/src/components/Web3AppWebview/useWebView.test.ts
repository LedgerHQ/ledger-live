import Config from "react-native-config";
import { renderHook } from "@tests/test-renderer";
import type { WebViewMessageEvent } from "react-native-webview";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import type { BridgeSession } from "@ledgerhq/live-common/wallet-api/bridgeSession";
import { sendWalletAPIResponse } from "~/e2e/bridge/client";
import { webviewLogStore } from "../../e2e/webviewLogStore";
import {
  E2E_WEBVIEW_CONSOLE_LOG_TYPE,
  E2E_WEBVIEW_NETWORK_LOG_TYPE,
} from "../../e2e/webviewNetworkLogCapture";
import { useWebView } from "./helpers";

const mockOnWalletApiMessage = jest.fn();
const mockOnDappMessage = jest.fn();

let mockBridgeSession: BridgeSession | undefined;

jest.mock("@ledgerhq/live-common/wallet-api/react", () => ({
  ...jest.requireActual("@ledgerhq/live-common/wallet-api/react"),
  // Serves the bridge session like the real server: its messages reach `mockOnWalletApiMessage`.
  useWalletAPIServer: ({ bridgeSession }: { bridgeSession: BridgeSession }) => {
    mockBridgeSession = bridgeSession;
    bridgeSession.onMessage = mockOnWalletApiMessage;
    bridgeSession.activate();
    return { onLoadError: jest.fn(), server: {} };
  },
  useCacheBustedLiveApps: () => ({ edit: jest.fn(), getLatest: jest.fn() }),
}));

jest.mock("@ledgerhq/live-common/wallet-api/useDappLogic", () => ({
  ...jest.requireActual("@ledgerhq/live-common/wallet-api/useDappLogic"),
  useDappLogic: () => ({
    onDappMessage: mockOnDappMessage,
    noAccounts: false,
    isLoadingAccounts: false,
  }),
}));

jest.mock("~/screens/Platform/v2/hooks", () => ({
  useCacheBustedLiveAppsDB: () => [{}, jest.fn(), true],
}));

jest.mock("LLM/features/ModularDrawer", () => ({
  useModularDrawerController: () => ({ openDrawer: jest.fn() }),
}));

jest.mock("~/e2e/bridge/client", () => ({ sendWalletAPIResponse: jest.fn() }));

jest.mock("./domainCheckReport", () => ({
  reportDomainCheckViolation: jest.fn(),
  reportDroppedBridgeMessage: jest.fn(),
  reportIfStrictlyDisallowed: jest.fn(),
}));

const manifest = {
  id: "test-app",
  name: "Test App",
  url: "https://app.example.com",
  domains: ["https://app.example.com"],
  apiVersion: "^2.0.0",
  manifestVersion: "2",
  platforms: ["ios", "android"],
  permissions: [],
} as unknown as LiveAppManifest;

const WALLET_API_MESSAGE = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "account.list" });
const DAPP_MESSAGE = { type: "dapp", jsonrpc: "2.0", id: 2, method: "eth_chainId" };

const e2eLog = (type: string) => JSON.stringify({ type, payload: { id: 1 } });

const messageEvent = (data: string, url: string, isMainFrame?: boolean) =>
  ({ nativeEvent: { data, url, isMainFrame } }) as unknown as WebViewMessageEvent;

function renderWebView(manifestDomainCheckEnabled: boolean) {
  const { result } = renderHook(() =>
    useWebView({ manifest, manifestDomainCheckEnabled }, null, jest.fn()),
  );
  return result.current;
}

describe("useWebView bridge messages", () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    mockOnWalletApiMessage.mockClear();
    mockOnDappMessage.mockClear();
    warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  describe("with the domain check on", () => {
    it("restricts the Android listener to the manifest origins", () => {
      expect(renderWebView(true).messagingAllowedOrigins).toEqual(["https://app.example.com"]);
    });

    it("answers the main frame on a manifest origin", () => {
      const { onMessage } = renderWebView(true);

      onMessage(messageEvent(WALLET_API_MESSAGE, "https://app.example.com/swap", true));
      onMessage(messageEvent(JSON.stringify(DAPP_MESSAGE), "https://app.example.com/", true));

      expect(mockOnWalletApiMessage).toHaveBeenCalledWith(WALLET_API_MESSAGE);
      expect(mockOnDappMessage).toHaveBeenCalledWith(DAPP_MESSAGE);
    });

    it("hands a message that is not JSON to the Wallet API server", () => {
      const { onMessage } = renderWebView(true);

      onMessage(messageEvent("not json", "https://app.example.com/", true));

      expect(mockOnWalletApiMessage).toHaveBeenCalledWith("not json");
    });

    it.each([
      ["a subframe", "https://app.example.com/", false],
      ["an unknown frame", "https://app.example.com/", undefined],
      ["another origin", "https://evil.com/", true],
      ["an opaque origin", "about:blank", true],
    ])("drops a message from %s", (_, url, isMainFrame) => {
      const { onMessage } = renderWebView(true);

      onMessage(messageEvent(WALLET_API_MESSAGE, url, isMainFrame));
      onMessage(messageEvent(JSON.stringify(DAPP_MESSAGE), url, isMainFrame));

      expect(mockOnWalletApiMessage).not.toHaveBeenCalled();
      expect(mockOnDappMessage).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalledWith(
        "Dropped a Live App bridge message from a disallowed frame",
        expect.any(Object),
      );
    });

    it("ignores an empty message", () => {
      const { onMessage } = renderWebView(true);

      onMessage(messageEvent("", "https://app.example.com/", true));

      expect(mockOnWalletApiMessage).not.toHaveBeenCalled();
    });
  });

  describe("with the domain check off", () => {
    it("exposes the bridge to any origin", () => {
      expect(renderWebView(false).messagingAllowedOrigins).toBeUndefined();
    });

    it("answers a frame the platform cannot tell, but never a subframe", () => {
      const { onMessage } = renderWebView(false);

      onMessage(messageEvent(WALLET_API_MESSAGE, "https://app.example.com/", undefined));
      onMessage(messageEvent(WALLET_API_MESSAGE, "https://app.example.com/", false));

      expect(mockOnWalletApiMessage).toHaveBeenCalledTimes(1);
    });

    it("drops a message from another origin than the session one, and resets the session", () => {
      const { onMessage } = renderWebView(false);
      onMessage(messageEvent(WALLET_API_MESSAGE, "https://app.example.com/", true));
      const servedSession = mockBridgeSession;

      onMessage(messageEvent(WALLET_API_MESSAGE, "https://other.com/", true));

      expect(mockOnWalletApiMessage).toHaveBeenCalledTimes(1);
      expect(servedSession?.isOpen).toBe(false);
    });
  });

  describe("E2E messages", () => {
    afterEach(() => {
      Object.assign(Config, { DETOX: undefined, MOCK: false });
    });

    it("stores the webview logs under Detox, whatever the frame", () => {
      Object.assign(Config, { DETOX: "1" });
      const addNetworkLog = jest.spyOn(webviewLogStore, "addNetworkLog").mockImplementation();
      const addConsoleLog = jest.spyOn(webviewLogStore, "addConsoleLog").mockImplementation();
      const { onMessage } = renderWebView(true);

      onMessage(messageEvent(e2eLog(E2E_WEBVIEW_NETWORK_LOG_TYPE), "https://evil.com/", false));
      onMessage(messageEvent(e2eLog(E2E_WEBVIEW_CONSOLE_LOG_TYPE), "https://evil.com/", false));

      expect(addNetworkLog).toHaveBeenCalledWith({ id: 1 });
      expect(addConsoleLog).toHaveBeenCalledWith({ id: 1 });
      expect(mockOnWalletApiMessage).not.toHaveBeenCalled();
      addNetworkLog.mockRestore();
      addConsoleLog.mockRestore();
    });

    it("answers the mock E2E bridge in mock builds", () => {
      Object.assign(Config, { MOCK: "1" });
      const { onMessage } = renderWebView(true);

      onMessage(messageEvent(JSON.stringify({ type: "e2eTest", payload: { id: 3 } }), "", true));

      expect(sendWalletAPIResponse).toHaveBeenCalledWith({ id: 3 });
    });
  });
});
