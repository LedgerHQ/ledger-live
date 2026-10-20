import React from "react";
import { render } from "@testing-library/react";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import type { UiHook } from "@ledgerhq/live-common/wallet-api/react";
import { app } from "~/renderer/bridge";
import { WalletAPIWebview } from "./WalletAPIWebview";
import { useWebviewState } from "./helpers";

let mockUiHook: Partial<UiHook> = {};
const mockDispatch = jest.fn();

jest.mock("@ledgerhq/live-common/wallet-api/react", () => ({
  ...jest.requireActual("@ledgerhq/live-common/wallet-api/react"),
  useConfig: jest.fn(() => ({})),
  useWalletAPIServer: jest.fn(({ uiHook }: { uiHook: Partial<UiHook> }) => {
    mockUiHook = uiHook;
    return {
      widgetLoaded: true,
      onLoad: jest.fn(),
      onReload: jest.fn(),
      onMessage: jest.fn(),
      server: undefined,
    };
  }),
}));

jest.mock("@ledgerhq/live-common/wallet-api/useDappLogic", () => ({
  useDappLogic: () => ({ onDappMessage: jest.fn(), noAccounts: false, isLoadingAccounts: false }),
}));

jest.mock("@ledgerhq/live-common/wallet-api/ModularDrawer/useDrawerConfiguration", () => ({
  useDrawerConfiguration: () => ({ createDrawerConfiguration: jest.fn() }),
}));

jest.mock("@ledgerhq/live-common/notifications/ToastProvider/index", () => ({
  useToasts: () => ({ pushToast: jest.fn() }),
}));

jest.mock("./helpers", () => ({
  useWebviewState: jest.fn(),
  getAttachedWebview: jest.fn(),
}));

jest.mock("LLD/hooks/redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock("@domain/entity-client-identity", () => ({
  userIdSelector: () => ({ exportUserIdForWalletAPI: () => "user-id" }),
}));

jest.mock("~/renderer/reducers/accounts", () => ({
  ...jest.requireActual("~/renderer/reducers/accounts"),
  flattenAccountsSelector: () => [],
}));

jest.mock("~/renderer/reducers/settings", () => ({
  ...jest.requireActual("~/renderer/reducers/settings"),
  mevProtectionSelector: () => false,
  shareAnalyticsSelector: () => false,
}));

jest.mock("~/renderer/reducers/wallet", () => ({
  ...jest.requireActual("~/renderer/reducers/wallet"),
  walletSelector: () => ({ accountNames: new Map() }),
}));

jest.mock("@features/platform-feature-flags", () => ({
  useFeature: () => null,
}));

jest.mock("LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer", () => ({
  useOpenAssetAndAccount: () => ({ openAssetAndAccount: jest.fn() }),
}));

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: jest.fn(),
}));

const manifest: LiveAppManifest = {
  id: "test-app",
  name: "Test App",
  private: false,
  url: "https://example.com",
  homepageUrl: "https://example.com",
  icon: "",
  platforms: ["desktop"],
  apiVersion: "^2.0.0",
  manifestVersion: "2",
  branch: "stable",
  categories: [],
  currencies: "*",
  content: { shortDescription: { en: "Test" }, description: { en: "Test" } },
  permissions: [],
  domains: ["https://example.com"],
  visibility: "complete",
};

type Handler = (...args: unknown[]) => void;
const callbacks = { onSuccess: jest.fn(), onError: jest.fn(), onCancel: jest.fn() };

describe("WalletAPIWebview UI hooks", () => {
  beforeAll(() => {
    Object.defineProperty(globalThis, "api", {
      value: { appDirname: "/fake/path", openWindow: jest.fn() },
      writable: true,
    });
  });

  beforeEach(() => {
    jest.mocked(useWebviewState).mockReturnValue({
      webviewState: { loading: false, isAppUnavailable: false },
      webviewRef: { current: null },
      setWebviewRef: jest.fn(),
      webviewProps: {},
      webviewPartition: {},
      handleRefresh: jest.fn(),
    } as never);
    render(<WalletAPIWebview manifest={manifest} />);
  });

  it.each([
    "account.request",
    "account.receive",
    "account.publicKeyUnavailable",
    "message.sign",
    "transaction.sign",
    "transaction.signRaw",
    "device.transport",
    "device.select",
    "exchange.start",
    "exchange.complete",
  ] as const)("%s should bring the window to the front", name => {
    const handler = mockUiHook[name] as Handler;

    handler({ ...callbacks, transaction: {}, exchangeParams: {}, signFlowInfos: {} });

    expect(app.show).toHaveBeenCalledTimes(1);
  });

  it.each(["storage.get", "storage.set"] as const)(
    "%s should not bring the window to the front",
    name => {
      const handler = mockUiHook[name] as Handler;

      handler({ key: "key", value: "value", storeId: "store" });

      expect(app.show).not.toHaveBeenCalled();
    },
  );
});
