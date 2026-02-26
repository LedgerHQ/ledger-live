import React from "react";
import { Text } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import { MockedAccounts } from "./mockedAccounts";
import { AccountsShortListView } from "../components/AccountShortListView";
import { ScreenName } from "~/const";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { Props } from "../hooks/useAccountsListViewModel";

jest.mock("@ledgerhq/live-countervalues-react", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues-react"),
  useCalculate: ({ value }: { value: number }) => value,
}));

const INITIAL_STATE = {
  overrideInitialState: (state: State) => ({
    ...state,
    accounts: MockedAccounts,
    settings: {
      ...state.settings,
      readOnlyModeEnabled: false,
    },
  }),
};

const Stack = createNativeStackNavigator();

const renderComponent = (props: Omit<Props, "sourceScreenName"> = {}) => {
  const ScreenComponent = () => (
    <AccountsShortListView sourceScreenName={ScreenName.Portfolio} {...props} />
  );

  return render(
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TestScreen" component={ScreenComponent} />
    </Stack.Navigator>,
    INITIAL_STATE,
  );
};

describe("AccountsShortListView", () => {
  it("should render all accounts when no limit is set", () => {
    renderComponent({});
    const accountsList = screen.getByTestId("AccountsList");

    expect(accountsList).toBeVisible();

    // 7 accounts from MockedAccounts + 1 token sub-account = 8 total
    const expectedAccountCount = 8;
    const balances = screen.getAllByTestId("account-balance");
    expect(balances.length).toBe(expectedAccountCount);
    expect(screen.getAllByTestId("account-balance").length).toBe(expectedAccountCount);
  });

  it("should limit the number of displayed accounts", () => {
    renderComponent({ limitNumberOfAccounts: 3 });
    const accountItems = screen.getAllByTestId("account-balance");
    expect(accountItems.length).toBe(3);
  });

  it("should render account names", () => {
    renderComponent({});
    expect(screen.getByText(/cronos 2/i)).toBeVisible();
    expect(screen.getByText(/dash 2/i)).toBeVisible();
    expect(screen.getByText(/dogecoin 2/i)).toBeVisible();
    expect(screen.getByText(/energy web 2/i)).toBeVisible();
    expect(screen.getByText(/ethereum classic 2/i)).toBeVisible();
    expect(screen.getByText(/linea 2/i)).toBeVisible();
    expect(screen.getByText(/tether/i)).toBeVisible();
  });

  it("should render the ListFooterComponent when provided", () => {
    const { getByText } = renderComponent({
      ListFooterComponent: <Text>See all accounts</Text>,
    });
    expect(getByText("See all accounts")).toBeVisible();
  });

  it("should render only specific accounts when provided", () => {
    renderComponent({
      specificAccounts: [MockedAccounts.active[0]],
    });
    expect(screen.getByText(/cronos 2/i)).toBeVisible();
    const accountItems = screen.getAllByTestId("account-balance");
    expect(accountItems.length).toBe(1);
  });

  it("should render an empty list when specificAccounts is empty", () => {
    renderComponent({
      specificAccounts: [],
    });
    const accountsList = screen.getByTestId("AccountsList");
    expect(accountsList).toBeVisible();
    expect(screen.queryAllByTestId("account-balance").length).toBe(0);
  });

  it("should handle account press", async () => {
    const { user } = renderComponent({ limitNumberOfAccounts: 3 });
    const accountItems = screen.getAllByTestId("account-balance");
    expect(accountItems.length).toBe(3);

    // Press the first account - should not throw
    await user.press(accountItems[0]);
  });

  it("should limit and render specific accounts together", () => {
    // Use specificAccounts with a limit that is less than the array length
    const threeAccounts = MockedAccounts.active.slice(0, 3);
    renderComponent({
      specificAccounts: threeAccounts,
      limitNumberOfAccounts: 2,
    });
    const accountItems = screen.getAllByTestId("account-balance");
    expect(accountItems.length).toBe(2);
  });
});
