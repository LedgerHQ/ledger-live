import React from "react";
import { render } from "@tests/test-renderer";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { BorrowLiveAppWrapper } from "../BorrowLiveAppWrapper";

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
  useBorrowLiveConfig: jest.fn().mockReturnValue(undefined),
}));

jest.mock("~/helpers/getStakeLabelLocaleBased", () => ({
  getCountryLocale: jest.fn().mockReturnValue("US"),
}));

jest.mock("LLM/features/Borrow/components/BorrowWebView", () => ({
  BorrowWebView: React.forwardRef(function MockBorrowWebView(
    _props: Record<string, unknown>,
    _ref: React.Ref<unknown>,
  ) {
    return <></>;
  }),
}));

const mockManifest = {
  id: "borrow",
  url: "https://borrow.example.com",
} as unknown as LiveAppManifest;

describe("BorrowLiveAppWrapper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useLocalLiveAppManifest).mockReturnValue(undefined);
    jest.mocked(useRemoteLiveAppManifest).mockReturnValue(mockManifest);
    jest.mocked(useRemoteLiveAppContext).mockReturnValue({
      state: { isLoading: false },
    } as ReturnType<typeof useRemoteLiveAppContext>);
  });

  it("should render without crashing", () => {
    const { getByTestId } = render(<BorrowLiveAppWrapper />);
    expect(getByTestId("borrow-screen")).toBeVisible();
  });
});
