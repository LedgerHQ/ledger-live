import React from "react";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import * as systemLocale from "~/helpers/systemLocale";
import MarketTopCards from "../index";

jest.mock("~/helpers/systemLocale", () => {
  const actual = jest.requireActual("~/helpers/systemLocale");
  return {
    __esModule: true,
    ...actual,
    getParsedSystemDeviceLocale: jest.fn(actual.getParsedSystemDeviceLocale),
  };
});

const mockGetParsedSystemDeviceLocale =
  systemLocale.getParsedSystemDeviceLocale as jest.MockedFunction<
    typeof systemLocale.getParsedSystemDeviceLocale
  >;

const assetDiscoverabilityOn = withFlagOverrides({
  lwdWallet40: { enabled: true, params: { assetDiscoverability: true } },
});

const assetDiscoverabilityOff = withFlagOverrides({
  lwdWallet40: { enabled: false },
});

describe("MarketTopCards", () => {
  beforeEach(() => {
    mockGetParsedSystemDeviceLocale.mockReturnValue({ language: "en", region: "US" });
  });

  it("renders the section with the global market cap, mood index and altcoin season cards when assetDiscoverability is on", async () => {
    render(<MarketTopCards />, { initialState: assetDiscoverabilityOn });

    expect(screen.getByRole("region", { name: /market top cards/i })).toBeVisible();

    expect(await screen.findByTestId("global-market-cap-card")).toBeVisible();
    expect(await screen.findByTestId("mood-index-card")).toBeVisible();
    expect(await screen.findByTestId("alt-season-index-card")).toBeVisible();
  });

  it("renders nothing when assetDiscoverability is off", () => {
    render(<MarketTopCards />, { initialState: assetDiscoverabilityOff });

    expect(screen.queryByRole("region", { name: /market top cards/i })).toBeNull();
  });

  it("hides the mood index card for UK users while keeping the other cards", async () => {
    mockGetParsedSystemDeviceLocale.mockReturnValue({ language: "en", region: "GB" });

    render(<MarketTopCards />, { initialState: assetDiscoverabilityOn });

    expect(await screen.findByTestId("global-market-cap-card")).toBeVisible();
    expect(await screen.findByTestId("alt-season-index-card")).toBeVisible();
    expect(screen.queryByTestId("mood-index-card")).toBeNull();
  });
});
