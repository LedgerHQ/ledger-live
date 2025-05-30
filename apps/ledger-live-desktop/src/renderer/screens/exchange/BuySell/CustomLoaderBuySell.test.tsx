import React from "react";
import { BUY_SELL_UI_APP_ID } from "@ledgerhq/live-common/wallet-api/constants";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { render, screen, act } from "tests/testSetup";
import { CustomLoaderBuySell } from "./CustomLoaderBuySell";

jest.useFakeTimers();

jest.mock("@ledgerhq/live-common/featureFlags/useFeature", () => jest.fn());
const mockedUseFeature = useFeature as jest.Mock;

describe("CustomLoaderBuySell", () => {
  beforeEach(() => {
    mockedUseFeature.mockReturnValue({
      enabled: true,
      params: { durationMs: 300 },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.clearAllTimers();
  });

  it("should not render when buySellLoader feature flag is disabled", () => {
    mockedUseFeature.mockReturnValue({ enabled: false });
    render(<CustomLoaderBuySell isLoading={true} manifest={getMockManifest({})} />);

    expect(screen.queryByTestId("custom-buy-sell-loader")).not.toBeInTheDocument();
  });

  it("should not render when app is internal Buy/Sell", () => {
    render(
      <CustomLoaderBuySell
        isLoading={true}
        manifest={getMockManifest({ mockInternalApp: true })}
      />,
    );

    expect(screen.queryByTestId("custom-buy-sell-loader")).not.toBeInTheDocument();
  });

  it("should not render when isLoading is false", () => {
    render(<CustomLoaderBuySell isLoading={false} manifest={getMockManifest({})} />);

    expect(screen.queryByTestId("custom-buy-sell-loader")).not.toBeInTheDocument();
  });

  it("should render correctly and persist for the duration specified in buySellLoader feature flag", () => {
    /* @ts-expect-error custom RenderReturn type does not cover rerender */
    const { rerender } = render(
      <CustomLoaderBuySell isLoading={true} manifest={getMockManifest({})} />,
    );

    expect(screen.getByTestId("custom-buy-sell-loader")).toBeInTheDocument();
    expect(screen.getByText("Connecting you to Moonpay")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(100);
    });

    rerender(<CustomLoaderBuySell isLoading={false} manifest={getMockManifest({})} />);

    expect(screen.getByTestId("custom-buy-sell-loader")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(screen.getByTestId("custom-buy-sell-loader")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(screen.queryByTestId("custom-buy-sell-loader")).not.toBeInTheDocument();
  });

  it("should persist over the set duration while isLoading is true", () => {
    render(<CustomLoaderBuySell isLoading={true} manifest={getMockManifest({})} />);

    expect(screen.getByTestId("custom-buy-sell-loader")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.getByTestId("custom-buy-sell-loader")).toBeInTheDocument();
  });
});

const getMockManifest = ({ mockInternalApp }: { mockInternalApp?: boolean }): LiveAppManifest => {
  return {
    id: mockInternalApp ? BUY_SELL_UI_APP_ID : "moonpay",
    name: "Moonpay",
    url: "",
    homepageUrl: "",
    platforms: [],
    apiVersion: "^2.0.0",
    manifestVersion: "2",
    branch: "experimental",
    categories: [],
    currencies: [],
    content: {
      shortDescription: {
        en: "",
      },
      description: {
        en: "",
      },
    },
    permissions: [],
    domains: [],
    visibility: "complete",
  };
};
