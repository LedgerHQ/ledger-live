import React from "react";
import { render, screen } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import PortfolioAssets from "../PortfolioAssets";
import TestNavigator, { INITIAL_STATE, SlicedMockedAccounts } from "./shared";
import { track } from "~/analytics";

describe("portfolioAssets", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });
  it("should render empty portfolio", async () => {
    render(
      <TestNavigator>
        <PortfolioAssets hideEmptyTokenAccount={false} openAddModal={() => null} />
      </TestNavigator>,
      {
        overrideInitialState: (state: State) => ({
          ...INITIAL_STATE.overrideInitialState(state),
          accounts: { ...state.accounts },
        }),
      },
    );

    expect(await screen.findByText(/add account/i)).toBeVisible();
    expect(screen.queryByText(/bitcoin/i)).toBeNull();
  });

  it("should render portfolio with assets and accounts list", async () => {
    const { user } = render(
      <TestNavigator>
        <PortfolioAssets hideEmptyTokenAccount={false} openAddModal={() => null} />
      </TestNavigator>,
      { ...INITIAL_STATE },
    );

    expect(screen.getByTestId("AssetsList")).toBeVisible();
    expect(screen.getByText(/accounts/i)).toBeVisible();
    expect(screen.getByText(/see all assets/i)).toBeVisible();
    expect(screen.getByTestId("assetItem-Cronos")).toBeVisible();
    expect(screen.getByText(/cronos 2/i)).not.toBeVisible();

    await user.press(screen.getByText(/accounts/i));

    jest.advanceTimersByTime(600);

    //screen.debug();

    expect(screen.getByText(/see all accounts/i)).toBeVisible();
    expect(screen.getByText(/add new or existing account/i)).toBeVisible();
    // await waitFor(() => expect(screen.getByText(/cronos 2/i)).toBeVisible());
  });

  it("should hide see all button and display add account button because there is less than 5 assets", async () => {
    const { user } = render(
      <TestNavigator>
        <PortfolioAssets hideEmptyTokenAccount={false} openAddModal={() => null} />
      </TestNavigator>,
      {
        overrideInitialState: (state: State) => ({
          ...INITIAL_STATE.overrideInitialState(state),
          accounts: SlicedMockedAccounts,
        }),
      },
    );

    expect(await screen.getByTestId("AssetsList")).toBeVisible();
    expect(screen.queryByText(/see all assets/i)).toBeNull();
    expect(screen.getByText(/add account/i)).toBeVisible();

    await user.press(screen.getByText(/accounts/i));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Accounts",
      page: "Wallet",
    });

    jest.advanceTimersByTime(600);

    expect(screen.queryByText(/see all accounts/i)).toBeNull();

    await user.press(screen.getByText(/assets/i));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Assets",
      page: "Wallet",
    });

    jest.advanceTimersByTime(600);
  });

  it("should render assets list screen", async () => {
    const { user } = render(
      <TestNavigator>
        <PortfolioAssets hideEmptyTokenAccount={false} openAddModal={() => null} />
      </TestNavigator>,
      { ...INITIAL_STATE },
    );

    expect(await screen.getByTestId("AssetsList")).toBeVisible();
    expect(screen.getByText(/see all assets/i)).toBeVisible();
    await user.press(screen.getByText(/see all assets/i));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "See all assets",
      page: "Wallet",
    });

    expect(await screen.queryAllByTestId(/^assetItem-/)).toHaveLength(6);
  });

  it("should render accounts list screen", async () => {
    const { user } = render(
      <TestNavigator>
        <PortfolioAssets hideEmptyTokenAccount={false} openAddModal={() => null} />
      </TestNavigator>,
      { ...INITIAL_STATE },
    );
    expect(await screen.getByTestId("AssetsList")).toBeVisible();

    await user.press(screen.getByText(/accounts/i));

    jest.advanceTimersByTime(600);

    expect(screen.getByText(/see all accounts/i)).toBeVisible();
    await user.press(screen.getByText(/see all accounts/i));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "See all accounts",
      page: "Wallet",
    });

    expect(await screen.queryAllByTestId(/^accountItem-/)).toHaveLength(6);
  });
});
