import React from "react";
import { renderWithMockedCounterValuesProvider, screen, waitFor } from "tests/testSetup";
import { useNavigate } from "react-router";
import { server } from "tests/server";
import { trackPage } from "~/renderer/analytics/segment";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import { BTC_ACCOUNT, ETH_ACCOUNT_WITH_USDC } from "LLD/features/__mocks__/accounts.mock";
import PayTab from "..";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(() => mockNavigate),
}));

const mockedUseNavigate = jest.mocked(useNavigate);
const mockedTrackPage = jest.mocked(trackPage);

const EMPTY_TITLE = "Pay and get paid";
const EMPTY_DESCRIPTION = "Start by depositing stablecoin to your wallet";

const onboardedState = { settings: { ...AFTER_ONBOARDING_STATE, counterValue: "USD" } };

describe("PayTab feature integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigate.mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("should render the empty hero when the user holds no stablecoins", async () => {
    renderWithMockedCounterValuesProvider(<PayTab />, {
      initialState: { ...onboardedState, accounts: [BTC_ACCOUNT] },
    });

    expect(await screen.findByText(EMPTY_TITLE)).toBeVisible();
    expect(screen.getByText(EMPTY_DESCRIPTION)).toBeVisible();
  });

  it("should render the aggregated stablecoin balance when the user holds USDC", async () => {
    renderWithMockedCounterValuesProvider(<PayTab />, {
      initialState: { ...onboardedState, accounts: [BTC_ACCOUNT, ETH_ACCOUNT_WITH_USDC] },
    });

    await waitFor(() => {
      expect(screen.getByTestId("pay-card-balance-funded-state")).toBeVisible();
    });
    expect(screen.queryByText(EMPTY_TITLE)).not.toBeInTheDocument();
  });

  it("should track the Pay page with the active balance filter on view", () => {
    renderWithMockedCounterValuesProvider(<PayTab />, {
      initialState: { ...onboardedState, accounts: [BTC_ACCOUNT] },
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
      initialState: { ...onboardedState, accounts: [BTC_ACCOUNT] },
    });

    expect(await screen.findByRole("button", { name: "Login" })).toBeVisible();
  });
});
