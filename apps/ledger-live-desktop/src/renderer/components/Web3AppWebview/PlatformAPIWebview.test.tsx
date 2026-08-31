import React from "react";
import { render } from "@testing-library/react";
import { PlatformAPIWebview } from "./PlatformAPIWebview";
import { useWebviewState } from "./helpers";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";

jest.mock("./helpers", () => ({
  useWebviewState: jest.fn(),
  getAttachedWebview: jest.fn(),
}));

jest.mock("./NetworkError", () => ({
  NetworkErrorScreen: ({ refresh }: { refresh: () => void }) => (
    <div data-testid="network-error-screen" onClick={refresh} />
  ),
}));

jest.mock("./styled", () => ({
  Loader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="loader">{children}</div>
  ),
}));

jest.mock("../BigSpinner", () => ({
  __esModule: true,
  default: () => <div data-testid="spinner" />,
}));

jest.mock("LLD/hooks/redux", () => ({
  useDispatch: () => jest.fn(),
  useSelector: jest.fn(selector => selector({})),
}));

jest.mock("@ledgerhq/live-common/notifications/ToastProvider/index", () => ({
  useToasts: () => ({ pushToast: jest.fn() }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

jest.mock("@ledgerhq/live-common/platform/react", () => ({
  useListPlatformAccounts: () => jest.fn(),
  useListPlatformCurrencies: () => jest.fn(),
}));

jest.mock("@ledgerhq/live-common/platform/JSONRPCServer", () => ({
  useJSONRPCServer: () => [jest.fn()],
}));

jest.mock("@ledgerhq/live-common/platform/logic", () => ({
  receiveOnAccountLogic: jest.fn(),
  signTransactionLogic: jest.fn(),
  completeExchangeLogic: jest.fn(),
  signMessageLogic: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/platform/serializers", () => ({
  serializePlatformSignedTransaction: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/platform/tracking", () => ({
  __esModule: true,
  default: () => ({
    platformLoad: jest.fn(),
    platformLoadSuccess: jest.fn(),
    platformSignMessageUserRefused: jest.fn(),
    platformReceiveSuccess: jest.fn(),
    platformReceiveFail: jest.fn(),
    platformStartExchangeRequested: jest.fn(),
    platformStartExchangeSuccess: jest.fn(),
    platformStartExchangeFail: jest.fn(),
    platformCompleteExchangeSuccess: jest.fn(),
    platformCompleteExchangeFail: jest.fn(),
    platformSignTransactionSuccess: jest.fn(),
    platformSignTransactionFail: jest.fn(),
    platformSignMessageSuccess: jest.fn(),
    platformSignMessageFail: jest.fn(),
  }),
}));

jest.mock("@features/platform-currencies", () => ({
  useFeatureFlaggedCurrencies: () => ({ deactivatedCurrencyIds: [] }),
}));

jest.mock("@features/platform-env", () => ({ __esModule: true, default: () => false }));

jest.mock("@features/platform-feature-flags", () => ({
  useFeature: () => null,
}));

jest.mock("LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer", () => ({
  useOpenAssetAndAccount: () => ({ openAssetAndAccountPromise: jest.fn() }),
}));

jest.mock("~/renderer/reducers/accounts", () => ({
  flattenAccountsSelector: jest.fn(() => []),
}));

jest.mock("~/renderer/reducers/settings", () => ({
  mevProtectionSelector: jest.fn(() => false),
}));

jest.mock("~/renderer/reducers/wallet", () => ({
  walletSelector: jest.fn(() => ({ accountNames: {} })),
}));

jest.mock("~/renderer/reducers/modularDialog", () => ({
  setFlowValue: jest.fn(),
  setSourceValue: jest.fn(),
}));

jest.mock("~/renderer/analytics/originFlow", () => ({
  setOriginFlow: jest.fn(),
}));

jest.mock("~/renderer/analytics/segment", () => ({ track: jest.fn() }));

jest.mock("~/renderer/analytics/screenRefs", () => ({
  currentRouteNameRef: { current: null },
}));

jest.mock("~/renderer/analytics/hooks/variables", () => ({
  HOOKS_TRACKING_LOCATIONS: {},
}));

jest.mock("../../actions/modals", () => ({ openModal: jest.fn() }));

jest.mock("./LiveAppSDKLogic", () => ({
  requestAccountLogic: jest.fn(),
  broadcastTransactionLogic: jest.fn(),
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
  apiVersion: "^1.0.0",
  manifestVersion: "2",
  branch: "stable",
  categories: [],
  currencies: "*",
  content: { shortDescription: { en: "Test" }, description: { en: "Test" } },
  permissions: [],
  domains: ["https://example.com"],
  visibility: "complete",
};

const mockWebviewState = (overrides = {}) => ({
  loading: false,
  isAppUnavailable: false,
  url: new URL("https://example.com"),
  canGoBack: false,
  canGoForward: false,
  title: "",
  ...overrides,
});

const defaultHookResult = {
  webviewState: mockWebviewState(),
  webviewRef: { current: null },
  setWebviewRef: jest.fn(),
  webviewProps: { src: "https://example.com" },
  webviewPartition: {},
  handleRefresh: jest.fn(),
};

const mockUseWebviewState = jest.mocked(useWebviewState);

describe("PlatformAPIWebview", () => {
  beforeAll(() => {
    Object.defineProperty(global, "api", {
      value: { appDirname: "/fake/path", openWindow: jest.fn() },
      writable: true,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWebviewState.mockReturnValue(defaultHookResult as never);
  });

  it("shows NetworkErrorScreen and hides Loader when isAppUnavailable", () => {
    mockUseWebviewState.mockReturnValue({
      ...defaultHookResult,
      webviewState: mockWebviewState({ isAppUnavailable: true }),
    } as never);

    const { queryByTestId } = render(<PlatformAPIWebview manifest={mockManifest} />);

    expect(queryByTestId("network-error-screen")).toBeInTheDocument();
    expect(queryByTestId("loader")).not.toBeInTheDocument();
  });

  it("hides NetworkErrorScreen when app is available", () => {
    const { queryByTestId } = render(<PlatformAPIWebview manifest={mockManifest} />);

    expect(queryByTestId("network-error-screen")).not.toBeInTheDocument();
  });

  it("shows Loader while widget is loading and no error", () => {
    const { queryByTestId } = render(<PlatformAPIWebview manifest={mockManifest} />);

    expect(queryByTestId("loader")).toBeInTheDocument();
  });
});
