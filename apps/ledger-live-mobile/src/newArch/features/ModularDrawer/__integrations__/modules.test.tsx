import React from "react";
import { act, render } from "@tests/test-renderer";
import {
  mockedAccounts,
  mockedFF,
  ModularDrawerSharedNavigator,
  WITHOUT_ACCOUNT_SELECTION,
} from "./shared";
import { INITIAL_STATE } from "~/reducers/settings";
import { State } from "~/reducers/types";

jest.mock("@ledgerhq/live-common/modularDrawer/hooks/useAcceptedCurrency", () => ({
  useAcceptedCurrency: () => mockUseAcceptedCurrency(),
}));

const mockUseAcceptedCurrency = jest.fn(() => () => true);

const advanceTimers = () => {
  act(() => {
    jest.advanceTimersByTime(500);
  });
};

describe("ModularDrawer modules integration", () => {
  it("should display the number of accounts on network list", async () => {
    const { getByText, getAllByText, user } = render(
      <ModularDrawerSharedNavigator
        networksConfiguration={{
          leftElement: "numberOfAccounts",
        }}
      />,
      {
        ...INITIAL_STATE,
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: {
            active: mockedAccounts,
          },
          settings: {
            ...state.settings,
            overriddenFeatureFlags: mockedFF,
          },
        }),
      },
    );

    await user.press(getByText(WITHOUT_ACCOUNT_SELECTION));
    advanceTimers();
    await user.press(getByText(/ethereum/i));
    advanceTimers();
    expect(getByText(/2 accounts/i)).toBeVisible();
    expect(getAllByText(/1 account/i).length).toBe(3);
  });

  it("should not display the number of accounts if the configuration is not provided", async () => {
    const { getByText, queryByText, user } = render(<ModularDrawerSharedNavigator />);
    await user.press(getByText(WITHOUT_ACCOUNT_SELECTION));
    advanceTimers();
    await user.press(getByText(/ethereum/i));
    expect(queryByText(/2 accounts/i)).toBeNull();
  });

  it("should display the apy indicator on asset list", async () => {
    const { getByText, queryAllByText, user } = render(
      <ModularDrawerSharedNavigator
        assetsConfiguration={{
          leftElement: "apy",
        }}
      />,
      {
        ...INITIAL_STATE,
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: mockedFF,
          },
        }),
      },
    );
    await user.press(getByText(WITHOUT_ACCOUNT_SELECTION));
    advanceTimers();
    expect(getByText(/ethereum/i)).toBeVisible();
    expect(queryAllByText(/3.66% APY/i)).not.toBeNull();
  });

  it("should not display the apy indicator if the configuration is not provided", async () => {
    const { queryByText, user } = render(<ModularDrawerSharedNavigator />);
    await user.press(queryByText(WITHOUT_ACCOUNT_SELECTION));
    advanceTimers();
    expect(queryByText(/3.66% APY/i)).toBeNull();
  });

  it("should display market trend on the left at assetSelection step", async () => {
    const { getByText, queryAllByText, user } = render(
      <ModularDrawerSharedNavigator
        assetsConfiguration={{
          leftElement: "marketTrend",
        }}
      />,
      {
        ...INITIAL_STATE,
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: mockedFF,
          },
        }),
      },
    );
    await user.press(getByText(WITHOUT_ACCOUNT_SELECTION));
    advanceTimers();
    expect(getByText(/ethereum/i)).toBeVisible();
    const percentElements = queryAllByText(/[+-]?\d+\.?\d*%/);
    expect(percentElements.length).toBeGreaterThan(0);
  });

  it("should display market trend on the right at assetSelection step", async () => {
    const { getByText, queryAllByText, user } = render(
      <ModularDrawerSharedNavigator
        assetsConfiguration={{
          rightElement: "marketTrend",
        }}
      />,
      {
        ...INITIAL_STATE,
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: mockedFF,
          },
        }),
      },
    );
    await user.press(getByText(WITHOUT_ACCOUNT_SELECTION));
    advanceTimers();
    expect(getByText(/ethereum/i)).toBeVisible();
    const percentElements = queryAllByText(/[+-]?\d+\.?\d*%/);
    expect(percentElements.length).toBeGreaterThan(0);
    const priceElements = queryAllByText(/\$\d+\.?\d*/);
    expect(priceElements.length).toBeGreaterThan(0);
  });

  it("should display the number of accounts and apy indicator on network list", async () => {
    const { getByText, getAllByText, user } = render(
      <ModularDrawerSharedNavigator
        networksConfiguration={{
          leftElement: "numberOfAccountsAndApy",
        }}
      />,
      {
        ...INITIAL_STATE,
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: {
            active: mockedAccounts,
          },
          settings: {
            ...state.settings,
            overriddenFeatureFlags: mockedFF,
          },
        }),
      },
    );

    await user.press(getByText(WITHOUT_ACCOUNT_SELECTION));
    advanceTimers();
    await user.press(getByText(/ethereum/i));
    advanceTimers();
    expect(getByText(/2 accounts/i)).toBeVisible();
    expect(getAllByText(/1 account/i).length).toBe(3);
    expect(getAllByText(/3.66% APY/i).length).toBe(1);
  });

  it("should display balance on the right at assetSelection step", async () => {
    const { getByText, user } = render(
      <ModularDrawerSharedNavigator
        assetsConfiguration={{
          rightElement: "balance",
        }}
      />,
      {
        ...INITIAL_STATE,
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: {
            active: mockedAccounts,
          },
          settings: {
            ...state.settings,
            overriddenFeatureFlags: mockedFF,
          },
        }),
      },
    );

    await user.press(getByText(WITHOUT_ACCOUNT_SELECTION));
    advanceTimers();
    expect(getByText(/ethereum/i)).toBeVisible();
    expect(getByText(/34,478.4 ETH/i)).toBeVisible();
  });

  it("should display balance on the right at networkSelection step", async () => {
    const { getByText, getAllByText, user } = render(
      <ModularDrawerSharedNavigator
        networksConfiguration={{
          rightElement: "balance",
        }}
      />,
      {
        ...INITIAL_STATE,
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: {
            active: mockedAccounts,
          },
          settings: {
            ...state.settings,
            overriddenFeatureFlags: mockedFF,
          },
        }),
      },
    );

    await user.press(getByText(WITHOUT_ACCOUNT_SELECTION));
    advanceTimers();
    const ethereumElements = getAllByText(/ethereum/i);
    await user.press(ethereumElements[0]);
    advanceTimers();
    expect(getByText(/23.4663 ETH/i)).toBeVisible();
  });
});
