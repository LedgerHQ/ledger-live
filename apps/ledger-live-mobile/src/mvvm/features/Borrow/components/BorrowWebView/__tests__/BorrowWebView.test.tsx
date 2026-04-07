import React from "react";
import { render } from "@tests/test-renderer";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import type { BorrowWebviewInputs } from "LLM/features/Borrow/screens/BorrowLiveApp/useBorrowLiveAppViewModel";
import { BorrowWebView } from "../BorrowWebView";

jest.mock("~/components/Web3AppWebview", () => ({
  Web3AppWebview: React.forwardRef(function MockWeb3AppWebview(
    _props: Record<string, unknown>,
    _ref: React.Ref<unknown>,
  ) {
    return <></>;
  }),
}));

jest.mock("~/components/WebPlatformPlayer/CustomHandlers", () => ({
  useDeeplinkCustomHandlers: jest.fn().mockReturnValue({}),
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

describe("BorrowWebView", () => {
  it("should render without crashing", () => {
    const setWebviewState = jest.fn();

    const { toJSON } = render(
      <BorrowWebView
        manifest={mockManifest}
        setWebviewState={setWebviewState}
        inputs={defaultInputs}
      />,
    );

    expect(toJSON()).not.toBeNull();
  });
});
