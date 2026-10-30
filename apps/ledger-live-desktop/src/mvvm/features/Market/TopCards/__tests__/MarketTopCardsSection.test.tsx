import React from "react";
import { render, screen } from "tests/testSetup";
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

describe("MarketTopCards", () => {
  beforeEach(() => {
    mockGetParsedSystemDeviceLocale.mockReturnValue({ language: "en", region: "US" });
  });

  it("renders the section with the global market cap, mood index and altcoin season cards", async () => {
    render(<MarketTopCards />);

    expect(screen.getByRole("region", { name: /market top cards/i })).toBeVisible();

    expect(await screen.findByTestId("global-market-cap-card")).toBeVisible();
    expect(await screen.findByTestId("mood-index-card")).toBeVisible();
    expect(await screen.findByTestId("alt-season-index-card")).toBeVisible();
  });

  it("hides the mood index card for UK users while keeping the other cards", async () => {
    mockGetParsedSystemDeviceLocale.mockReturnValue({ language: "en", region: "GB" });

    render(<MarketTopCards />);

    expect(await screen.findByTestId("global-market-cap-card")).toBeVisible();
    expect(await screen.findByTestId("alt-season-index-card")).toBeVisible();
    expect(screen.queryByTestId("mood-index-card")).toBeNull();
  });
});
