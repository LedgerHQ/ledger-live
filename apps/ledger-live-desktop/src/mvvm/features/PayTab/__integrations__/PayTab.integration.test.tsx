import React from "react";
import {
  renderWithMockedCounterValuesProvider,
  fireEvent,
  screen,
  waitFor,
  render,
  within,
} from "tests/testSetup";
import { useNavigate } from "react-router";
import { track, trackPage } from "~/renderer/analytics/segment";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import { BTC_ACCOUNT, ETH_ACCOUNT_WITH_USDC } from "LLD/features/__mocks__/accounts.mock";
import { payCardFeatureTourInitialState } from "@features/flow-pay-card-feature-tour/state";
import PayTab from "LLD/features/PayTab";
import { usePayStablecoins, type PayStablecoins } from "../hooks/usePayStablecoins";
import { USDC, USDT, makeItem } from "../hooks/__tests__/fixtures";

const mockNavigate = jest.fn();

jest.mock("../hooks/usePayStablecoins", () => ({
  usePayStablecoins: jest.fn(),
}));

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(() => mockNavigate),
}));

const mockedUseNavigate = jest.mocked(useNavigate);
const mockedTrackPage = jest.mocked(trackPage);
const mockedTrack = jest.mocked(track);
const mockedUsePayStablecoins = jest.mocked(usePayStablecoins);

const EMPTY_TITLE = "Pay and get paid";
const EMPTY_DESCRIPTION = "Start by depositing stablecoin to your wallet";
const FEATURE_TOUR_ROW = "Minimal volatility";

const onboardedState = { settings: { ...AFTER_ONBOARDING_STATE, counterValue: "USD" } };
const tourSeenState = {
  payCardFeatureTour: { ...payCardFeatureTourInitialState, hasSeenFeatureTour: true },
};
const fundedState = {
  ...onboardedState,
  ...tourSeenState,
  accounts: [BTC_ACCOUNT, ETH_ACCOUNT_WITH_USDC],
};

const defaultPayStablecoins: PayStablecoins = {
  stablecoins: [],
  defaultStablecoins: [USDC, USDT],
  isLoading: false,
  isError: false,
};

function mockPayStablecoins(overrides: Partial<PayStablecoins> = {}) {
  mockedUsePayStablecoins.mockReturnValue({
    ...defaultPayStablecoins,
    ...overrides,
  });
}

function mockFundedPayStablecoins() {
  mockPayStablecoins({
    stablecoins: [makeItem(USDC.id, USDC.ticker, USDC.name, 1000)],
  });
}

jest.mock("@features/flow-pay-card-auth", () => ({
  CardLogin: () => <button type="button">Login</button>,
}));

describe("PayTab integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPayStablecoins();
    mockedUseNavigate.mockReturnValue(mockNavigate);
  });

  it("should show the feature tour on first visit", () => {
    render(<PayTab />, {
      initialState: {
        payCardFeatureTour: { ...payCardFeatureTourInitialState, hasSeenFeatureTour: false },
      },
    });

    expect(screen.getByText(FEATURE_TOUR_ROW)).toBeVisible();
    expect(screen.getByRole("button", { name: "Got it" })).toBeVisible();
  });

  it("should persist dismissal and hide the tour after clicking Got it", async () => {
    const { user, store } = render(<PayTab />, {
      initialState: {
        payCardFeatureTour: { ...payCardFeatureTourInitialState, hasSeenFeatureTour: false },
      },
    });

    expect(screen.getByText(FEATURE_TOUR_ROW)).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Got it" }));

    await waitFor(() => {
      expect(store.getState().payCardFeatureTour.hasSeenFeatureTour).toBe(true);
      expect(screen.queryByText(FEATURE_TOUR_ROW)).not.toBeInTheDocument();
    });
  });

  it("should not show the feature tour once it has been seen", () => {
    render(<PayTab />, {
      initialState: tourSeenState,
    });

    expect(screen.queryByText(FEATURE_TOUR_ROW)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Got it" })).not.toBeInTheDocument();
  });

  it("should render the empty hero when the user holds no stablecoins", async () => {
    renderWithMockedCounterValuesProvider(<PayTab />, {
      initialState: { ...onboardedState, ...tourSeenState, accounts: [BTC_ACCOUNT] },
    });

    expect(await screen.findByText(EMPTY_TITLE)).toBeVisible();
    expect(screen.getByText(EMPTY_DESCRIPTION)).toBeVisible();
  });

  it("should render the aggregated stablecoin balance when the user holds USDC", async () => {
    mockFundedPayStablecoins();

    renderWithMockedCounterValuesProvider(<PayTab />, {
      initialState: { ...onboardedState, ...tourSeenState },
    });

    await waitFor(() => {
      expect(screen.getByTestId("pay-card-balance-funded-state")).toBeVisible();
      expect(screen.queryByTestId("pay-card-balance-empty-state")).not.toBeInTheDocument();
    });
  });

  it("should track the Pay page with the active balance filter on view", () => {
    renderWithMockedCounterValuesProvider(<PayTab />, {
      initialState: { ...onboardedState, ...tourSeenState, accounts: [BTC_ACCOUNT] },
    });

    expect(mockedTrackPage).toHaveBeenCalledWith(
      "Pay",
      undefined,
      expect.objectContaining({ balance_filter: "all" }),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });

  it("should still render the card login block below the hero", async () => {
    renderWithMockedCounterValuesProvider(<PayTab />, {
      initialState: { ...onboardedState, ...tourSeenState, accounts: [BTC_ACCOUNT] },
    });

    expect(await screen.findByRole("button", { name: "Login" })).toBeVisible();
  });

  it("should open the balance filter dialog from the hero pill and track the interaction", async () => {
    mockFundedPayStablecoins();

    renderWithMockedCounterValuesProvider(<PayTab />, {
      initialState: fundedState,
    });

    await waitFor(() => {
      expect(screen.getByTestId("pay-card-balance-filter-pill")).toBeVisible();
    });

    fireEvent.click(screen.getByTestId("pay-card-balance-filter-pill"));

    const dialog = await screen.findByTestId("pay-card-balance-filter-picker");
    expect(dialog).toHaveTextContent("USD Coin");
    expect(dialog).toHaveTextContent("Tether USD");
    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", { button: "balance_filter" });
  });

  it("should open the deposit options dialog from the deposit action tile", async () => {
    mockFundedPayStablecoins();

    renderWithMockedCounterValuesProvider(<PayTab />, {
      initialState: fundedState,
    });

    const depositTile = await screen.findByRole("button", { name: "Add stablecoin" });
    fireEvent.click(depositTile);

    expect(await screen.findByTestId("pay-card-deposit-options")).toBeVisible();
    expect(screen.getByTestId("pay-card-deposit-option-swap")).toBeVisible();
  });

  it("should persist the selected stablecoin, update the hero pill and track the confirmation", async () => {
    mockFundedPayStablecoins();

    const { store } = renderWithMockedCounterValuesProvider(<PayTab />, {
      initialState: fundedState,
    });

    await waitFor(() => {
      expect(screen.getByTestId("pay-card-balance-filter-pill")).toBeVisible();
    });

    fireEvent.click(screen.getByTestId("pay-card-balance-filter-pill"));

    fireEvent.click(await screen.findByTestId("pay-card-balance-filter-option-usdc"));
    fireEvent.click(screen.getByTestId("pay-card-balance-filter-confirm"));

    await waitFor(() => {
      expect(screen.queryByTestId("pay-card-balance-filter-picker")).not.toBeInTheDocument();
    });

    expect(store.getState().payCardBalance.balanceFilter).toBe(USDC.id);

    const pill = screen.getByTestId("pay-card-balance-filter-pill");
    expect(within(pill).getByText("USDC")).toBeVisible();

    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      button: "confirm_balance_filter",
      asset: "USDC",
    });
  });
});
