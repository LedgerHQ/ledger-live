import React from "react";
import { fireEvent, render, screen } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import PortfolioAssets from "../PortfolioAssets";
import TestNavigator, { INITIAL_STATE, SlicedMockedAccounts } from "./shared";
import { track } from "~/analytics";

const mockLayoutEvent = (width: number) => ({
  nativeEvent: {
    layout: {
      width,
    },
  },
});

describe("portfolioAssets", () => {
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

    fireEvent(screen.getByTestId("portfolio-assets-layout"), "layout", mockLayoutEvent(722));

    expect(screen.getByTestId("AssetsList")).toBeVisible();
    expect(screen.getByText(/accounts/i)).toBeVisible();
    expect(screen.getByText(/see all assets/i)).toBeVisible();
    expect(screen.getByTestId("assetItem-Cronos")).toBeVisible();
    expect(screen.getByText(/cronos 2/i)).not.toBeVisible();

    await user.press(screen.getByText(/accounts/i));

    expect(screen.getByText(/see all accounts/i)).toBeVisible();
    expect(screen.getByText(/add new or existing account/i)).toBeVisible();
    expect(screen.getByText(/cronos 2/i)).toBeDefined();
    //expect(screen.getByText("Cronos 2")).toBeVisible();
    // FIXME this is not visible in the test after the animation. It seems that the useSharedValue are not updated in the test environment so cronos 2 is always not visible even if it should be visible.
  });

  it("should hide see all button because there is less than 5 assets", async () => {
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
    expect(screen.queryByText(/add account/i)).toBeNull();
    expect(screen.queryByText(/add new or existing account/i)).toBeNull();

    await user.press(screen.getByText(/accounts/i));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Accounts",
      page: "Wallet",
    });

    expect(screen.queryByText(/see all accounts/i)).toBeNull();
    expect(screen.queryByText(/add account/i)).toBeNull();
    expect(screen.queryByText(/add new or existing account/i)).toBeVisible();

    await user.press(screen.getByText(/assets/i));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Assets",
      page: "Wallet",
    });
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

    const lineaAsset = screen.getByText(/linea/i);
    const ethClassicAsset = screen.getByText(/ethereum classic/i);
    const energyWebAsset = screen.getByText(/energy web/i);
    const dogecoinAsset = screen.getByText(/dogecoin/i);
    const dashAsset = screen.getAllByText(/dash/i)[0];
    const cronosAsset = screen.getByText(/cronos/i);

    [lineaAsset, ethClassicAsset, energyWebAsset, dogecoinAsset, dashAsset, cronosAsset].forEach(
      asset => {
        expect(asset).toBeVisible();
      },
    );
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

    expect(screen.getByText(/see all accounts/i)).toBeVisible();
    await user.press(screen.getByText(/see all accounts/i));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "See all accounts",
      page: "Wallet",
    });

    expect(screen.getByText(/add new or existing account/i)).toBeVisible();

    const lineaAccount = screen.getByText(/linea 2/i);
    const ethClassicAccount = screen.getByText(/ethereum classic 2/i);
    const energyWebAccount = screen.getByText(/energy web 2/i);
    const dogecoinAccount = screen.getByText(/dogecoin 2/i);
    const dashAccount = screen.getByText(/dash 2/i);
    const cronosAccount = screen.getByText(/cronos 2/i);

    [
      lineaAccount,
      ethClassicAccount,
      energyWebAccount,
      dogecoinAccount,
      dashAccount,
      cronosAccount,
    ].forEach(account => {
      expect(account).toBeVisible();
    });
  });
});
