import React from "react";
import { fireEvent, render, screen } from "@tests/test-renderer";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import {
  createRequest,
  __resetForTests as resetRegistry,
} from "@ledgerhq/live-common/wallet-api/LiveAppModal/registry";
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

describe("LiveAppModal integration", () => {
  beforeEach(() => {
    resetRegistry();
    mockNavigation.goBack.mockClear();
  });

  it("renders the modal from real redux state and wires the close button to redux + navigation", () => {
    const { requestId } = createRequest({ payload: { foo: "bar" } });

    const { store } = render(
      // @ts-expect-error -- partial navigation mock is sufficient for this test
      <LiveAppModalScreen navigation={mockNavigation} route={mockRoute} />,
      {
        overrideInitialState: state => ({
          ...state,
          liveAppModal: {
            requestId,
            manifestId: "test-app",
            path: "/",
            title: "Modal Title",
          },
        }),
      },
    );

    expect(screen.getByText("Modal Title")).toBeTruthy();
    expect(screen.getByTestId("web3-app-webview")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("Close"));

    expect(store.getState().liveAppModal).toBeNull();
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });

  it("settles the real registry promise on unmount (system back / swipe-to-dismiss)", async () => {
    const { requestId, promise } = createRequest({ payload: null });

    const { store, unmount } = render(
      // @ts-expect-error -- partial navigation mock is sufficient for this test
      <LiveAppModalScreen navigation={mockNavigation} route={mockRoute} />,
      {
        overrideInitialState: state => ({
          ...state,
          liveAppModal: {
            requestId,
            manifestId: "test-app",
            path: "/",
          },
        }),
      },
    );

    expect(store.getState().liveAppModal?.requestId).toBe(requestId);

    unmount();

    await expect(promise).resolves.toEqual({ result: undefined });
    expect(store.getState().liveAppModal).toBeNull();
  });

  it("renders nothing when redux has no active modal params, even if the registry has a pending request", () => {
    createRequest({ payload: null });

    render(
      // @ts-expect-error -- partial navigation mock is sufficient for this test
      <LiveAppModalScreen navigation={mockNavigation} route={mockRoute} />,
      {
        overrideInitialState: state => ({ ...state, liveAppModal: null }),
      },
    );

    expect(screen.queryByTestId("web3-app-webview")).toBeNull();
  });
});
