import React from "react";
import { render, screen, waitFor, within } from "@tests/test-renderer";
import { PAY_CARD_BALANCE_FILTER_ALL } from "@domain/entity-pay-card";
import type { State } from "~/reducers/types";
import { PayTabScreen } from "LLM/features/PayTab";

const mockTrackScreen = jest.fn();
const mockTrack = jest.fn();
const mockUsePayStablecoins = jest.fn();

jest.mock("LLM/hooks/useNavigationBarHeights", () => ({
  useNavigationBarHeights: () => ({ top: 0 }),
}));

jest.mock("~/analytics", () => ({
  TrackScreen: (props: Record<string, unknown>) => {
    mockTrackScreen(props);
    return null;
  },
  track: (...args: unknown[]) => mockTrack(...args),
}));

jest.mock("@features/flow-pay-card-auth", () => {
  const ReactModule = require("react");
  const { View } = require("react-native");
  return {
    CardLogin: () => ReactModule.createElement(View, { testID: "card-login" }),
  };
});

jest.mock("LLM/features/PayTab/hooks/usePayStablecoins", () => ({
  usePayStablecoins: () => mockUsePayStablecoins(),
}));

const EMPTY_TITLE = "Pay and get paid";
const EMPTY_DESCRIPTION = "Start by depositing stablecoin to your wallet";

const USDC_ID = "ethereum/erc20/usd__coin";
const USDT_ID = "ethereum/erc20/usd_tether__erc20_";

const DEFAULT_STABLECOINS = [
  { id: USDC_ID, ticker: "USDC", name: "USD Coin", magnitude: 6 },
  { id: USDT_ID, ticker: "USDT", name: "Tether USD", magnitude: 6 },
];

const heldUsdc = (value: number) => ({
  currency: {
    id: USDC_ID,
    name: "USD Coin",
    ticker: "USDC",
    units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
  },
  balance: value * 1_000_000,
  value,
});

const tourSeen = (state: State): State => ({
  ...state,
  payCard: { ...state.payCard, hasSeenFeatureTour: true },
});

function mockStablecoins(overrides: Record<string, unknown> = {}) {
  mockUsePayStablecoins.mockReturnValue({
    stablecoins: [],
    defaultStablecoins: DEFAULT_STABLECOINS,
    isLoading: false,
    isError: false,
    ...overrides,
  });
}

describe("PayTab balance integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStablecoins();
  });

  it("should render the empty hero when the user holds no stablecoins", async () => {
    render(<PayTabScreen />, { overrideInitialState: tourSeen });

    expect(await screen.findByTestId("pay-card-balance-empty-state")).toBeVisible();
    expect(screen.getByText(EMPTY_TITLE)).toBeVisible();
    expect(screen.getByText(EMPTY_DESCRIPTION)).toBeVisible();
    expect(screen.queryByTestId("pay-card-balance-funded-state")).toBeNull();
  });

  it("should render the aggregated stablecoin balance when the user holds stablecoins", async () => {
    mockStablecoins({ stablecoins: [heldUsdc(1000)] });

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

  it("should open the balance filter bottom sheet from the hero pill and track the interaction", async () => {
    mockStablecoins({ stablecoins: [heldUsdc(1000)] });

    const { user } = render(<PayTabScreen />, { overrideInitialState: tourSeen });

    const pill = await screen.findByTestId("pay-card-balance-filter-pill");
    expect(pill).toBeVisible();

    await user.press(pill);

    expect(await screen.findByTestId("pay-card-balance-filter-picker")).toBeVisible();
    expect(mockTrack).toHaveBeenCalledWith("button_clicked", { button: "balance_filter" });
  });

  it("should persist the selected stablecoin, update the hero pill and track the confirmation", async () => {
    mockStablecoins({ stablecoins: [heldUsdc(1000)] });

    const { user, store } = render(<PayTabScreen />, { overrideInitialState: tourSeen });

    await user.press(await screen.findByTestId("pay-card-balance-filter-pill"));

    await user.press(await screen.findByTestId("pay-card-balance-filter-option-usdc"));
    await user.press(screen.getByTestId("pay-card-balance-filter-confirm"));

    await waitFor(() => {
      expect(store.getState().payCard.balanceFilter).not.toBe(PAY_CARD_BALANCE_FILTER_ALL);
    });

    const pill = screen.getByTestId("pay-card-balance-filter-pill");
    expect(within(pill).getByText("USDC")).toBeVisible();

    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      button: "confirm_balance_filter",
      asset: "USDC",
    });
  });
});
