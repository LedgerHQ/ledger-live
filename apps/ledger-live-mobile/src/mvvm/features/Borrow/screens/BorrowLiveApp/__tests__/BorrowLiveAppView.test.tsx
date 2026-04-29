import React from "react";
import type { RefObject } from "react";
import { render } from "@tests/test-renderer";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import type { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import type { BorrowWebviewInputs } from "../useBorrowLiveAppViewModel";
import { BorrowLiveAppView } from "../index";

jest.mock("LLM/features/Borrow/components/BorrowWebView", () => ({
  BorrowWebView: React.forwardRef(function MockBorrowWebView(
    _props: Record<string, unknown>,
    _ref: React.Ref<unknown>,
  ) {
    return <></>;
  }),
}));

const mockManifest = { id: "borrow", url: "https://borrow.example.com" } as unknown as LiveAppManifest;

const defaultInputs: BorrowWebviewInputs = {
  devMode: "false",
  theme: "dark",
  lang: "en",
  locale: "en",
  countryLocale: "US",
  currencyTicker: "USD",
  OS: "ios",
  platform: "LLM",
};

const defaultProps = {
  manifest: mockManifest,
  error: null as Error | null,
  isLoading: false,
  webviewRef: { current: null } as RefObject<WebviewAPI | null>,
  onWebviewStateChange: jest.fn() as (state: WebviewState) => void,
  webviewInputs: defaultInputs,
};

describe("BorrowLiveAppView", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should render borrow screen when manifest is available", () => {
    const { getByTestId } = render(<BorrowLiveAppView {...defaultProps} />);
    expect(getByTestId("borrow-screen")).toBeVisible();
  });

  it("should render error view when there is an error and not loading", () => {
    const { queryByTestId } = render(
      <BorrowLiveAppView {...defaultProps} error={new Error("Network error")} />,
    );
    expect(queryByTestId("borrow-screen")).toBeNull();
  });

  it("should render loader when there is an error and is loading", () => {
    const { queryByTestId } = render(
      <BorrowLiveAppView {...defaultProps} error={new Error("Loading...")} isLoading />,
    );
    expect(queryByTestId("borrow-screen")).toBeNull();
  });

  it("should render empty borrow screen when manifest is undefined", () => {
    const { getByTestId } = render(
      <BorrowLiveAppView {...defaultProps} manifest={undefined} />,
    );
    expect(getByTestId("borrow-screen")).toBeVisible();
  });
});
