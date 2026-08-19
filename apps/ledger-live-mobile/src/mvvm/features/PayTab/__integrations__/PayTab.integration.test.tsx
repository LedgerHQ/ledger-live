import React from "react";
import { render, screen, waitFor, within } from "@tests/test-renderer";
import { PAY_CARD_BALANCE_FILTER_ALL } from "@features/flow-pay-card-balance/state";
import { NavigatorName, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import { PayTabScreen } from "LLM/features/PayTab";

const mockTrackScreen = jest.fn();
const mockTrack = jest.fn();
const mockUsePayStablecoins = jest.fn();
const mockNavigate = jest.fn();
const mockHandleOpenReceiveDrawer = jest.fn();
const mockHandleOpenSwap = jest.fn();
const mockHandleOpenBuySell = jest.fn();

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
    CardLogout: () => ReactModule.createElement(View, { testID: "card-logout" }),
  };
});

jest.mock("LLM/features/PayTab/hooks/usePayStablecoins", () => ({
  usePayStablecoins: () => mockUsePayStablecoins(),
}));

// PayTabScreen sits inside the Pay tab navigator in the app; these tests render it on its own, so
// the route that carries the OAuth redirect has to come from here.
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ params: undefined }),
}));

jest.mock("LLM/features/Receive", () => ({
  useOpenReceiveDrawer: () => ({ handleOpenReceiveDrawer: mockHandleOpenReceiveDrawer }),
}));

jest.mock("LLM/features/Swap", () => ({
  useOpenSwap: () => ({ handleOpenSwap: mockHandleOpenSwap }),
}));

jest.mock("LLM/features/Buy", () => ({
  useOpenBuySell: () => ({ handleOpenBuySell: mockHandleOpenBuySell }),
}));

const EMPTY_TITLE = "Pay and get paid";
const EMPTY_DESCRIPTION = "Start by depositing stablecoin to your wallet";

const FEATURE_TOUR_ROW = "Minimal volatility";
const FEATURE_TOUR_CTA = "Got it";

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

const withFeatureTourSeen =
  (hasSeenFeatureTour: boolean) =>
  (state: State): State => ({
    ...state,
    payCardFeatureTour: { ...state.payCardFeatureTour, hasSeenFeatureTour },
  });

const tourSeen = withFeatureTourSeen(true);
const tourNotSeen = withFeatureTourSeen(false);

function mockStablecoins(overrides: Record<string, unknown> = {}) {
  mockUsePayStablecoins.mockReturnValue({
    stablecoins: [],
    defaultStablecoins: DEFAULT_STABLECOINS,
    isLoading: false,
    isError: false,
    ...overrides,
  });
}

describe("PayTab integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStablecoins();
  });

  describe("feature tour", () => {
    it("should show the feature tour on first visit", async () => {
      render(<PayTabScreen />, { overrideInitialState: tourNotSeen });

      expect(screen.getByTestId("paytab-screen")).toBeVisible();
      await waitFor(() => {
        expect(screen.getByText(FEATURE_TOUR_ROW)).toBeVisible();
      });
    });

    it("should persist dismissal and hide the tour after pressing Got it", async () => {
      const { user, store } = render(<PayTabScreen />, { overrideInitialState: tourNotSeen });

      await waitFor(() => {
        expect(screen.getByText(FEATURE_TOUR_ROW)).toBeVisible();
      });

      await user.press(screen.getByText(FEATURE_TOUR_CTA));

      await waitFor(() => {
        expect(store.getState().payCardFeatureTour.hasSeenFeatureTour).toBe(true);
        expect(screen.queryByText(FEATURE_TOUR_ROW)).toBeNull();
      });
    });

    it("should not show the feature tour once it has been seen", () => {
      render(<PayTabScreen />, { overrideInitialState: tourSeen });

      expect(screen.getByTestId("paytab-screen")).toBeVisible();
      expect(screen.queryByText(FEATURE_TOUR_ROW)).toBeNull();
    });
  });

  describe("balance", () => {
    it("should render the empty hero when the user holds no stablecoins", async () => {
      render(<PayTabScreen />, { overrideInitialState: tourSeen });

      expect(await screen.findByTestId("pay-card-balance-empty-state")).toBeVisible();
      expect(screen.getByText(EMPTY_TITLE)).toBeVisible();
      expect(screen.getByText(EMPTY_DESCRIPTION)).toBeVisible();
      expect(screen.queryByTestId("pay-card-balance-funded-state")).toBeNull();
      expect(screen.queryByTestId("action-tile-deposit")).toBeNull();
      expect(screen.queryByTestId("action-tile-request")).toBeNull();
    });

    it("should render the aggregated stablecoin balance when the user holds stablecoins", async () => {
      mockStablecoins({ stablecoins: [heldUsdc(1000)] });

      render(<PayTabScreen />, { overrideInitialState: tourSeen });

      expect(await screen.findByTestId("pay-card-balance-funded-state")).toBeVisible();
      expect(screen.queryByTestId("pay-card-balance-empty-state")).toBeNull();
    });

    it("should render Deposit and Request action tiles when the hero is funded", async () => {
      mockStablecoins({ stablecoins: [heldUsdc(1000)] });

      render(<PayTabScreen />, { overrideInitialState: tourSeen });

      expect(await screen.findByTestId("action-tile-deposit")).toBeVisible();
      expect(screen.getByTestId("action-tile-request")).toBeVisible();
      expect(screen.getByText("Add stablecoin")).toBeVisible();
      expect(screen.getByText("Request")).toBeVisible();
    });

    it("should track button_clicked with quick_action location when an action tile is pressed", async () => {
      mockStablecoins({ stablecoins: [heldUsdc(1000)] });

      const { user } = render(<PayTabScreen />, { overrideInitialState: tourSeen });

      await user.press(await screen.findByTestId("action-tile-deposit"));

      expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
        button: "deposit",
        buttonLocation: "quick_action",
        page: "Pay",
      });

      await user.press(screen.getByTestId("action-tile-request"));

      expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
        button: "request",
        buttonLocation: "quick_action",
        page: "Pay",
      });
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
        expect(store.getState().payCardBalance.balanceFilter).not.toBe(PAY_CARD_BALANCE_FILTER_ALL);
      });

      const pill = screen.getByTestId("pay-card-balance-filter-pill");
      expect(within(pill).getByText("USDC")).toBeVisible();

      expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
        button: "confirm_balance_filter",
        asset: "USDC",
      });
    });
  });

  describe("deposit options", () => {
    beforeEach(() => {
      mockStablecoins({ stablecoins: [heldUsdc(1000)] });
    });

    it("opens the deposit options bottom sheet with the four options from the deposit tile", async () => {
      const { user } = render(<PayTabScreen />, { overrideInitialState: tourSeen });

      await user.press(await screen.findByTestId("action-tile-deposit"));

      expect(await screen.findByTestId("pay-card-deposit-options")).toBeVisible();
      expect(screen.getByText("Add stablecoins")).toBeVisible();
      (["bankTransfer", "swap", "receive", "buy"] as const).forEach(id => {
        expect(screen.getByTestId(`pay-card-deposit-option-${id}`)).toBeVisible();
      });
    });

    it("opens the receive drawer when the receive option is selected", async () => {
      const { user } = render(<PayTabScreen />, { overrideInitialState: tourSeen });

      await user.press(await screen.findByTestId("action-tile-deposit"));
      await user.press(await screen.findByTestId("pay-card-deposit-option-receive"));

      expect(mockHandleOpenReceiveDrawer).toHaveBeenCalledTimes(1);
    });

    it("navigates to the Noah fiat provider when the bank transfer option is selected", async () => {
      const { user } = render(<PayTabScreen />, { overrideInitialState: tourSeen });

      await user.press(await screen.findByTestId("action-tile-deposit"));
      await user.press(await screen.findByTestId("pay-card-deposit-option-bankTransfer"));

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.ReceiveFunds, {
        screen: ScreenName.ReceiveProvider,
        params: { manifestId: "noah", fromMenu: true },
      });
    });
  });
});
