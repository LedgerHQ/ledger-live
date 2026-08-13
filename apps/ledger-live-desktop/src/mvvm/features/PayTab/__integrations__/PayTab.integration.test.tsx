import React from "react";
import {
  renderWithMockedCounterValuesProvider,
  screen,
  waitFor,
  render,
  within,
} from "tests/testSetup";
import { useNavigate } from "react-router";
import { server } from "tests/server";
import { trackPage } from "~/renderer/analytics/segment";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import { BTC_ACCOUNT, ETH_ACCOUNT_WITH_USDC } from "LLD/features/__mocks__/accounts.mock";
import { payCardInitialState } from "@domain/entity-pay-card";
import PayTab from "LLD/features/PayTab";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(() => mockNavigate),
}));

const mockedUseNavigate = jest.mocked(useNavigate);
const mockedTrackPage = jest.mocked(trackPage);

const EMPTY_TITLE = "Pay and get paid";
const EMPTY_DESCRIPTION = "Start by depositing stablecoin to your wallet";
const FEATURE_TOUR_ROW = "Minimal volatility";

const onboardedState = { settings: { ...AFTER_ONBOARDING_STATE, counterValue: "USD" } };
const tourSeenState = { payCard: { ...payCardInitialState, hasSeenFeatureTour: true } };

jest.mock("@features/flow-pay-card-auth", () => ({
  CardLogin: () => <button type="button">Login</button>,
}));

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

describe("PayTab integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigate.mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("should show the feature tour on first visit", () => {
    render(<PayTab />, {
      initialState: { payCard: { ...payCardInitialState, hasSeenFeatureTour: false } },
    });

    expect(screen.getByText(FEATURE_TOUR_ROW)).toBeVisible();
    expect(screen.getByRole("button", { name: "Got it" })).toBeVisible();
  });

  it("should persist dismissal and hide the tour after clicking Got it", async () => {
    const { user, store } = render(<PayTab />, {
      initialState: { payCard: { ...payCardInitialState, hasSeenFeatureTour: false } },
    });

    expect(screen.getByText(FEATURE_TOUR_ROW)).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Got it" }));

    await waitFor(() => {
      expect(store.getState().payCard.hasSeenFeatureTour).toBe(true);
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
    const { container } = renderWithMockedCounterValuesProvider(<PayTab />, {
      initialState: {
        ...onboardedState,
        ...tourSeenState,
        accounts: [BTC_ACCOUNT, ETH_ACCOUNT_WITH_USDC],
      },
    });

    await waitFor(() => {
      expect(within(container).getByTestId("pay-card-balance-funded-state")).toBeVisible();
    });
    expect(within(container).queryByTestId("pay-card-balance-empty-state")).not.toBeInTheDocument();
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
});
