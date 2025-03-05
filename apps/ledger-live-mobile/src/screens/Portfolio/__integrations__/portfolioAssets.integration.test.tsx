import React from "react";
import { render, fireEvent } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import PortfolioAssets from "../PortfolioAssets";
import TestNavigator, { INITIAL_STATE, SlicedMockedAccounts } from "./shared";
import { track } from "~/analytics";

beforeEach(() => {
  jest.clearAllMocks();
});

enum Event {
  Layout = "layout",
  ContentSizeChange = "contentSizeChange",
}

const mockLayoutEvent = (width: number, height: number) => ({
  nativeEvent: {
    layout: {
      width,
      height,
    },
  },
});

const mockContentSizeChangeEvent = (width: number, height: number) => ({
  width,
  height,
});

describe("portfolioAssets", () => {
  it("should render quick actions", async () => {
    const { getByText } = render(
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
    const quickActions = [/buy/i, /swap/i, /send/i, /receive/i];
    quickActions.forEach(action => expect(getByText(action)).toBeVisible());
  });

  it("should track click on tab account", async () => {
    const { getByText, user } = render(
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
    await user.press(getByText(/accounts/i));
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Accounts",
      page: "Wallet",
    });
  });

  it("should not track the same tab account click", async () => {
    const { getByText, user } = render(
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
    await user.press(getByText(/accounts/i));
    await user.press(getByText(/accounts/i));
    expect(track).toHaveBeenCalledTimes(1);
  });

  it("should track click on tab assets", async () => {
    const { getByText, user } = render(
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
    await user.press(getByText(/accounts/i));
    await user.press(getByText(/assets/i));
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Assets",
      page: "Wallet",
    });
  });

  it("should not track the same tab assets click", async () => {
    const { getByText, user } = render(
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
    await user.press(getByText(/assets/i));
    expect(track).toHaveBeenCalledTimes(0);
  });

  it("should render assets list screen", async () => {
    const { getByText, getAllByText, getByTestId } = render(
      <TestNavigator>
        <PortfolioAssets hideEmptyTokenAccount={false} openAddModal={() => null} />
      </TestNavigator>,
      { ...INITIAL_STATE },
    );

    fireEvent(
      getByTestId(/AssetsList/),
      Event.ContentSizeChange,
      mockContentSizeChangeEvent(722, 722),
    );

    const assets = [
      { name: /ethereum classic/i, count: /0 ETC/i },
      { name: /energy web/i, count: /0 EWT/i },
      { name: /dogecoin/i, count: /8.33157 DOGE/i },
      { name: /dash/i, count: /8.33157 DASH/i },
      { name: /cronos/i, count: /0 CRO/i },
    ];

    assets.forEach(({ name, count }) => {
      expect(getAllByText(name)[0]).toBeVisible();
      expect(getByText(count)).toBeVisible();
    });
  });

  it("should render see all assets button", async () => {
    const { getByText, getByTestId, user } = render(
      <TestNavigator>
        <PortfolioAssets hideEmptyTokenAccount={false} openAddModal={() => null} />
      </TestNavigator>,
      { ...INITIAL_STATE },
    );

    fireEvent(
      getByTestId(/AssetsList/),
      Event.ContentSizeChange,
      mockContentSizeChangeEvent(722, 722),
    );

    const seeAllAssetsButton = getByText(/see all assets/i);
    expect(seeAllAssetsButton).toBeVisible();
    await user.press(seeAllAssetsButton);
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "See all assets",
      page: "Wallet",
    });
  });

  it("should not render see all assets button", async () => {
    const { queryByText } = render(
      <TestNavigator>
        <PortfolioAssets hideEmptyTokenAccount={true} openAddModal={() => null} />
      </TestNavigator>,
      {
        overrideInitialState: (state: State) => ({
          ...INITIAL_STATE.overrideInitialState(state),
          accounts: SlicedMockedAccounts,
        }),
      },
    );
    expect(queryByText(/see all assets/i)).toBeNull();
  });

  it("should render see all accounts button", async () => {
    const { getByText, getByTestId, user } = render(
      <TestNavigator>
        <PortfolioAssets hideEmptyTokenAccount={false} openAddModal={() => null} />
      </TestNavigator>,
      { ...INITIAL_STATE },
    );

    fireEvent(
      getByTestId(/AssetsList/),
      Event.ContentSizeChange,
      mockContentSizeChangeEvent(722, 722),
    );
    fireEvent(
      getByTestId(/AccountsList/),
      Event.ContentSizeChange,
      mockContentSizeChangeEvent(722, 722),
    );

    await user.press(getByText(/accounts/i));

    const seeAllAccountsButton = getByText(/see all accounts/i);
    expect(seeAllAccountsButton).toBeDefined();
    await user.press(seeAllAccountsButton);
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "See all accounts",
      page: "Wallet",
    });
  });

  it("should not render see all accounts button", async () => {
    const { queryByText } = render(
      <TestNavigator>
        <PortfolioAssets hideEmptyTokenAccount={true} openAddModal={() => null} />
      </TestNavigator>,
      {
        overrideInitialState: (state: State) => ({
          ...INITIAL_STATE.overrideInitialState(state),
          accounts: SlicedMockedAccounts,
        }),
      },
    );
    expect(queryByText(/see all accounts/i)).toBeNull();
  });

  it("should render accounts list", async () => {
    const { getByText, getByTestId, user } = render(
      <TestNavigator>
        <PortfolioAssets hideEmptyTokenAccount={false} openAddModal={() => null} />
      </TestNavigator>,
      { ...INITIAL_STATE },
    );

    fireEvent(getByTestId(/portfolio-assets-layout/i), Event.Layout, mockLayoutEvent(375, 640));

    fireEvent(
      getByTestId(/AssetsList/),
      Event.ContentSizeChange,
      mockContentSizeChangeEvent(361, 320),
    );
    fireEvent(
      getByTestId(/AccountsList/),
      Event.ContentSizeChange,
      mockContentSizeChangeEvent(361, 320),
    );

    await user.press(getByText(/accounts/i));
    const accounts = [
      { name: /ethereum classic 2/i, address: /0x79...1EAF/i },
      { name: /energy web 2/i, address: /0xDF...4D9C/i },
      { name: /dogecoin 2/i, address: /1Hcg...pTJ4/i },
      { name: /dash 2/i, address: /13jg...vead/i },
      { name: /cronos 2/i, address: /0x71...D5AF/i },
    ];

    accounts.forEach(({ name, address }) => {
      expect(getByText(name)).toBeDefined(); // FIXME : Animation not working in jest so we can't use toBeVisible
      expect(getByText(address)).toBeDefined(); // FIXME : Animation not working in jest so we can't use toBeVisible
    });
  });

  it("should navigate to Assets screen", async () => {
    const { getByText, getAllByText, user } = render(
      <TestNavigator>
        <PortfolioAssets hideEmptyTokenAccount={false} openAddModal={() => null} />
      </TestNavigator>,
      { ...INITIAL_STATE },
    );

    await user.press(getByText(/see all assets/i));

    const assets = [
      { name: /ethereum classic/i, count: /0 ETC/i },
      { name: /energy web/i, count: /0 EWT/i },
      { name: /dogecoin/i, count: /8.33157 DOGE/i },
      { name: /dash/i, count: /8.33157 DASH/i },
      { name: /cronos/i, count: /0 CRO/i },
      { name: /linea/i, count: /0 ETH/i }, // displayed only on assets page because it's the sixth asset
    ];

    assets.forEach(({ name, count }) => {
      expect(getAllByText(name)[0]).toBeVisible();
      expect(getByText(count)).toBeVisible();
    });
  });
});
