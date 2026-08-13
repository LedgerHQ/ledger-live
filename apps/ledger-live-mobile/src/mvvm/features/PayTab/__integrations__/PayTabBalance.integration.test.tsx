import React from "react";
import { render, screen, waitFor } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { PayTabScreen } from "LLM/features/PayTab";

const mockTrackScreen = jest.fn();
const mockUseCategorizedAssetsFromPortfolio = jest.fn();

jest.mock("LLM/hooks/useNavigationBarHeights", () => ({
  useNavigationBarHeights: () => ({ top: 0 }),
}));

jest.mock("~/analytics", () => ({
  TrackScreen: (props: Record<string, unknown>) => {
    mockTrackScreen(props);
    return null;
  },
  track: jest.fn(),
}));

jest.mock("@features/flow-pay-card-auth", () => {
  const ReactModule = require("react");
  const { View } = require("react-native");
  return {
    CardLogin: () => ReactModule.createElement(View, { testID: "card-login" }),
  };
});

jest.mock("LLM/hooks/useCategorizedAssetsFromPortfolio", () => ({
  useCategorizedAssetsFromPortfolio: () => mockUseCategorizedAssetsFromPortfolio(),
}));

const EMPTY_TITLE = "Pay and get paid";
const EMPTY_DESCRIPTION = "Start by depositing stablecoin to your wallet";

const tourSeen = (state: State): State => ({
  ...state,
  payCard: { ...state.payCard, hasSeenFeatureTour: true },
});

function mockPortfolio(overrides: Record<string, unknown> = {}) {
  mockUseCategorizedAssetsFromPortfolio.mockReturnValue({
    categorizedAssets: { cryptos: [], stocks: [], stablecoins: [] },
    isLoadingStablecoinTickers: false,
    isStablecoinTickersError: false,
    ...overrides,
  });
}

describe("PayTab balance hero integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPortfolio();
  });

  it("should render the empty hero when the user holds no stablecoins", async () => {
    render(<PayTabScreen />, { overrideInitialState: tourSeen });

    expect(await screen.findByTestId("pay-card-balance-empty-state")).toBeVisible();
    expect(screen.getByText(EMPTY_TITLE)).toBeVisible();
    expect(screen.getByText(EMPTY_DESCRIPTION)).toBeVisible();
    expect(screen.queryByTestId("pay-card-balance-funded-state")).toBeNull();
  });

  it("should render the aggregated stablecoin balance when the user holds stablecoins", async () => {
    mockPortfolio({
      categorizedAssets: {
        cryptos: [],
        stocks: [],
        stablecoins: [{ currency: { id: "ethereum/erc20/usdc" }, value: 1000 }],
      },
    });

    render(<PayTabScreen />, { overrideInitialState: tourSeen });

    expect(await screen.findByTestId("pay-card-balance-funded-state")).toBeVisible();
    expect(screen.queryByTestId("pay-card-balance-empty-state")).toBeNull();
  });

  it("should track the Pay page with the active balance filter on view", async () => {
    render(<PayTabScreen />, { overrideInitialState: tourSeen });

    await waitFor(() => {
      expect(mockTrackScreen).toHaveBeenCalledWith(
        expect.objectContaining({ category: "Pay", balance_filter: "all" }),
      );
    });
  });

  it("should still render the card login block below the hero", async () => {
    render(<PayTabScreen />, { overrideInitialState: tourSeen });

    expect(await screen.findByTestId("pay-card-balance-empty-state")).toBeVisible();
    expect(screen.getByTestId("card-login")).toBeVisible();
  });
});
