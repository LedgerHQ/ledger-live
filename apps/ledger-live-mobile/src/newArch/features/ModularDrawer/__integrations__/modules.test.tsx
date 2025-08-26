import React from "react";
import { render } from "@tests/test-renderer";
import {
  mockedAccounts,
  mockedFF,
  ModularDrawerSharedNavigator,
  WITHOUT_ACCOUNT_SELECTION,
} from "./shared";
import { useGroupedCurrenciesByProvider } from "@ledgerhq/live-common/modularDrawer/__mocks__/useGroupedCurrenciesByProvider.mock";
import { INITIAL_STATE } from "~/reducers/settings";
import { State } from "~/reducers/types";

jest.mock("@ledgerhq/live-common/deposit/useGroupedCurrenciesByProvider.hook", () => ({
  useGroupedCurrenciesByProvider: () => useGroupedCurrenciesByProvider(),
}));

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
    await user.press(getByText(/ethereum/i));
    jest.advanceTimersByTime(500);
    expect(getByText(/2 accounts/i)).toBeVisible();
    expect(getAllByText(/1 account/i).length).toBe(2);
  });

  it("should not display the number of accounts if the configuration is not provided", async () => {
    const { getByText, queryByText, user } = render(<ModularDrawerSharedNavigator />);
    await user.press(getByText(WITHOUT_ACCOUNT_SELECTION));
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
    expect(getByText(/ethereum/i)).toBeVisible();
    expect(queryAllByText(/5.11% APY/i).length).toBe(2);
  });

  it("should not display the apy indicator if the configuration is not provided", async () => {
    const { queryByText, user } = render(<ModularDrawerSharedNavigator />);
    await user.press(queryByText(WITHOUT_ACCOUNT_SELECTION));
    expect(queryByText(/5.11% APY/i)).toBeNull();
  });

  it("should display the number of accounts and apy indicator on network list", async () => {
    const { getByText, queryAllByText, getAllByText, user } = render(
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
    await user.press(getByText(/ethereum/i));
    jest.advanceTimersByTime(500);
    expect(getByText(/2 accounts/i)).toBeVisible();
    expect(getAllByText(/1 account/i).length).toBe(2);
    expect(queryAllByText(/5.11% APY/i).length).toBe(3);
  });
});
