import React from "react";
import { render, screen } from "@tests/test-renderer";
import { useNetInfo } from "@react-native-community/netinfo";
import type { NetInfoState } from "@react-native-community/netinfo";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { BorrowLiveAppWrapper } from "..";

jest.mock("~/components/Web3AppWebview/helpers", () => ({
  initialWebviewState: {
    url: "",
    canGoBack: false,
    canGoForward: false,
    title: "",
    loading: false,
  },
}));

jest.mock("@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index", () => ({
  useRemoteLiveAppManifest: jest.fn(),
  useRemoteLiveAppContext: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index", () => ({
  useLocalLiveAppManifest: jest.fn(),
}));

jest.mock("LLM/features/Borrow/hooks/useBorrowLiveConfig", () => ({
  useBorrowLiveConfig: jest.fn().mockReturnValue(null),
}));

jest.mock("~/helpers/getStakeLabelLocaleBased", () => ({
  getCountryLocale: jest.fn().mockReturnValue("US"),
}));

jest.mock("LLM/features/Borrow/components/BorrowWebView", () => ({
  BorrowWebView: React.forwardRef(function MockBorrowWebView(
    _props: Record<string, unknown>,
    _ref: React.Ref<unknown>,
  ) {
    const { View } = require("react-native");
    return <View testID="borrow-webview" />;
  }),
}));

const remoteManifest = { id: "borrow", url: "https://borrow.example.com" } as LiveAppManifest;

describe("Borrow integration (mobile)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useRemoteLiveAppManifest).mockReturnValue(remoteManifest);
    jest.mocked(useLocalLiveAppManifest).mockReturnValue(undefined);
    jest.mocked(useRemoteLiveAppContext).mockReturnValue({
      state: { isLoading: false },
    } as ReturnType<typeof useRemoteLiveAppContext>);
  });

  it("should render the borrow screen and webview when manifest is available", () => {
    render(<BorrowLiveAppWrapper />);

    expect(screen.getByTestId("borrow-screen")).toBeOnTheScreen();
    expect(screen.getByTestId("borrow-webview")).toBeOnTheScreen();
  });

  it("should prefer local manifest over remote", () => {
    const localManifest = {
      id: "borrow-local",
      url: "https://local.example.com",
    } as LiveAppManifest;
    jest.mocked(useLocalLiveAppManifest).mockReturnValue(localManifest);

    render(<BorrowLiveAppWrapper />);

    expect(screen.getByTestId("borrow-screen")).toBeOnTheScreen();
  });

  it("should render the error view when offline", () => {
    jest.mocked(useNetInfo).mockReturnValue({
      isConnected: false,
    } as NetInfoState);

    render(<BorrowLiveAppWrapper />);

    expect(screen.queryByTestId("borrow-screen")).toBeNull();
    expect(screen.getByTestId("generic-error-modal")).toBeOnTheScreen();
  });

  it("should render the loader when loading and offline", () => {
    jest.mocked(useNetInfo).mockReturnValue({
      isConnected: false,
    } as NetInfoState);
    jest.mocked(useRemoteLiveAppContext).mockReturnValue({
      state: { isLoading: true },
    } as ReturnType<typeof useRemoteLiveAppContext>);

    render(<BorrowLiveAppWrapper />);

    expect(screen.queryByTestId("borrow-screen")).toBeNull();
    expect(screen.queryByTestId("generic-error-modal")).toBeNull();
  });

  it("should call onNativeGoBack when go-back is triggered without canGoBack", () => {
    const onNativeGoBack = jest.fn();
    const onActionHandled = jest.fn();

    render(
      <BorrowLiveAppWrapper
        action="go-back"
        onNativeGoBack={onNativeGoBack}
        onActionHandled={onActionHandled}
      />,
    );

    expect(onNativeGoBack).toHaveBeenCalledTimes(1);
    expect(onActionHandled).toHaveBeenCalledTimes(1);
  });
});
