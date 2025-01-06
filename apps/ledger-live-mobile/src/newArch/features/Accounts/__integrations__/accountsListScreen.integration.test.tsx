import React from "react";
import { renderWithReactQuery } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import { MockedAccounts } from "./mockedAccounts";
import AccountsList from "../screens/AccountsList";
import { AccountsListNavigator } from "../screens/AccountsList/types";
import { ScreenName } from "~/const";
import { createStackNavigator } from "@react-navigation/stack";
const INITIAL_STATE = {
  overrideInitialState: (state: State) => ({
    ...state,
    accounts: MockedAccounts,
    settings: {
      ...state.settings,
      readOnlyModeEnabled: false,
      overriddenFeatureFlags: {
        llmAccountListUI: {
          enabled: true,
        },
        llmWalletSync: {
          enabled: true,
          params: {
            environment: "STAGING",
            watchConfig: {
              pollingInterval: 10000,
              initialTimeout: 5000,
              userIntentDebounce: 1000,
            },
          },
        },
      },
    },
  }),
};

describe("AccountsList Screen", () => {
  const renderComponent = (params: AccountsListNavigator[ScreenName.AccountsList]) => {
    const Stack = createStackNavigator<AccountsListNavigator>();

    return renderWithReactQuery(
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name={ScreenName.AccountsList}
          component={AccountsList}
          initialParams={params}
        />
      </Stack.Navigator>,
      {
        ...INITIAL_STATE,
      },
    );
  };

  it("should render with canAddAccount true", () => {
    const { getByText } = renderComponent({
      sourceScreenName: ScreenName.AccountsList,
      canAddAccount: true,
    });
    expect(getByText(/add new or existing account/i)).toBeVisible();
  });

  it("should render with showHeader true", () => {
    const { getByText } = renderComponent({
      sourceScreenName: ScreenName.AccountsList,
      showHeader: true,
    });
    expect(getByText(/accounts/i)).toBeVisible();
  });

  it("should render with showHeader and canAddAccount true", () => {
    const { getByText } = renderComponent({
      sourceScreenName: ScreenName.AccountsList,
      showHeader: true,
      canAddAccount: true,
    });
    expect(getByText(/accounts/i)).toBeVisible();
    expect(getByText(/add new or existing account/i)).toBeVisible();
  });

  it("should render the accounts list", () => {
    const { getByText } = renderComponent({
      sourceScreenName: ScreenName.AccountsList,
      showHeader: true,
      canAddAccount: true,
    });
    const lineaAccount = getByText(/linea 2/i);
    const ethClassicAccount = getByText(/ethereum classic 2/i);
    const energyWebAccount = getByText(/energy web 2/i);
    const dogecoinAccount = getByText(/dogecoin 2/i);
    const dashAccount = getByText(/dash 2/i);
    const cronosAccount = getByText(/cronos 2/i);

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

  it("should render only the Linea account", () => {
    const { getByText } = renderComponent({
      sourceScreenName: ScreenName.AccountsList,
      showHeader: true,
      specificAccounts: [MockedAccounts.active[0]],
    });

    expect(getByText(/cronos 2/i)).toBeVisible();
    expect(getByText(/cro accounts/i)).toBeVisible();
  });

  it("should open the add accounts drawer when there is no account specified", async () => {
    const { getByText, user } = renderComponent({
      sourceScreenName: ScreenName.AccountsList,
      showHeader: true,
      canAddAccount: true,
    });

    await user.press(getByText(/add new or existing account/i));
    expect(getByText(/add another account/i)).toBeVisible();
    expect(getByText(/use your ledger device/i)).toBeVisible();
    expect(getByText(/use ledger sync/i)).toBeVisible();
  });
});
