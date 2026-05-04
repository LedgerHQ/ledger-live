import React from "react";
import { fireEvent, render, screen } from "@tests/test-renderer";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import type { LiveAppModalParams } from "~/reducers/liveAppModal";
import type { State } from "~/reducers/types";
import LiveAppModalScreen from "../index";

const STUB_MANIFEST: LiveAppManifest = {
  id: "test-app",
  name: "Test App",
  url: "https://test.app",
  homepageUrl: "https://test.app",
  platforms: ["ios", "android"],
  apiVersion: "2.0.0",
  manifestVersion: "2",
  branch: "stable",
  permissions: [],
  domains: [],
  categories: [],
  currencies: "*",
  visibility: "complete",
  content: {
    shortDescription: { en: "test" },
    description: { en: "test" },
  },
};

const PARAMS: LiveAppModalParams = {
  requestId: "req-123",
  manifestId: "test-app",
  path: "/",
  title: "Modal Title",
};

const mockDismiss = jest.fn();
const mockRegisterCloseHandler = jest.fn();

jest.mock("@ledgerhq/live-common/wallet-api/LiveAppModal/registry", () => ({
  dismiss: (...args: unknown[]) => mockDismiss(...args),
  registerCloseHandler: (...args: unknown[]) => mockRegisterCloseHandler(...args),
}));

jest.mock("@ledgerhq/live-common/wallet-api/useLiveAppManifest", () => ({
  useLiveAppManifest: () => STUB_MANIFEST,
}));

jest.mock("@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index", () => ({
  useRemoteLiveAppContext: () => ({ state: { isLoading: false } }),
}));

jest.mock("@ledgerhq/live-common/wallet-api/LiveAppModal/server", () => ({
  handlers: () => ({}),
}));

jest.mock("@ledgerhq/live-common/wallet-api/CustomDeeplink/server", () => ({
  handlers: () => ({}),
}));

jest.mock("~/components/Web3AppWebview", () => {
  const { View } = require("react-native");
  return { Web3AppWebview: () => <View testID="web3-app-webview" /> };
});

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  canGoBack: jest.fn(),
  isFocused: jest.fn(),
  getParent: jest.fn(),
  replace: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  popTo: jest.fn(),
  popToTop: jest.fn(),
  reset: jest.fn(),
  getId: jest.fn(),
  getState: jest.fn(),
  setOptions: jest.fn(),
  preload: jest.fn(),
  navigateDeprecated: jest.fn(),
  replaceParams: jest.fn(),
};

const mockRoute = {
  key: "test",
  name: "LiveAppModal" as const,
};

const withParams =
  (params: LiveAppModalParams | null) =>
  (state: State): State => ({ ...state, liveAppModal: params });

describe("LiveAppModalScreen", () => {
  beforeEach(() => {
    mockDismiss.mockClear();
    mockRegisterCloseHandler.mockClear();
    mockNavigation.goBack.mockClear();
  });

  it("renders nothing when no modal params are in state", () => {
    render(
      // @ts-expect-error -- partial navigation mock is sufficient for this test
      <LiveAppModalScreen navigation={mockNavigation} route={mockRoute} />,
      { overrideInitialState: withParams(null) },
    );

    expect(screen.queryByTestId("web3-app-webview")).toBeNull();
  });

  it("renders the title and close button with accessibility label when modal is open", () => {
    render(
      // @ts-expect-error -- partial navigation mock is sufficient for this test
      <LiveAppModalScreen navigation={mockNavigation} route={mockRoute} />,
      { overrideInitialState: withParams(PARAMS) },
    );

    expect(screen.getByText("Modal Title")).toBeTruthy();
    expect(screen.getByLabelText("Close")).toBeTruthy();
    expect(screen.getByTestId("web3-app-webview")).toBeTruthy();
  });

  it("dismisses redux state and navigates back when the close button is pressed", () => {
    const { store } = render(
      // @ts-expect-error -- partial navigation mock is sufficient for this test
      <LiveAppModalScreen navigation={mockNavigation} route={mockRoute} />,
      { overrideInitialState: withParams(PARAMS) },
    );

    fireEvent.press(screen.getByLabelText("Close"));

    expect(store.getState().liveAppModal).toBeNull();
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });

  it("calls dismissRequest on unmount so the live-app RPC promise settles", () => {
    const { unmount } = render(
      // @ts-expect-error -- partial navigation mock is sufficient for this test
      <LiveAppModalScreen navigation={mockNavigation} route={mockRoute} />,
      { overrideInitialState: withParams(PARAMS) },
    );

    unmount();

    expect(mockDismiss).toHaveBeenCalledWith(PARAMS.requestId);
  });

  it("registers a close handler with the registry for the active requestId", () => {
    render(
      // @ts-expect-error -- partial navigation mock is sufficient for this test
      <LiveAppModalScreen navigation={mockNavigation} route={mockRoute} />,
      { overrideInitialState: withParams(PARAMS) },
    );

    expect(mockRegisterCloseHandler).toHaveBeenCalledWith(PARAMS.requestId, expect.any(Function));
  });
});
