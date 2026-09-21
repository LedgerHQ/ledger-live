import React from "react";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account } from "@ledgerhq/types-live";
import { render, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { screen, track } from "~/analytics";
import type { OperationsHistoryNavigatorParamsList } from "LLM/features/OperationsHistory/types";
import type { State } from "~/reducers/types";
import { ScreenName } from "~/const/navigation";
import OperationsList from "../index";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";

function withTwoCalendarDaySections(account: Account): Account {
  const newerDayMs = new Date("2020-06-15T15:00:00.000Z").getTime();
  const olderDayMs = newerDayMs - 24 * 60 * 60 * 1000;
  return {
    ...account,
    operations: account.operations.map((op, index) => ({
      ...op,
      date: new Date(index < 2 ? newerDayMs - index * 60_000 : olderDayMs - (index - 2) * 60_000),
    })),
  };
}

const accountWithOperations = withTwoCalendarDaySections(
  genAccount("operations-list-non-empty", {
    currency: getCryptoCurrencyById("bitcoin"),
    operationsSize: 5,
  }),
);

function stateWithAccountsAndOperations(base: State): State {
  return {
    ...base,
    accounts: {
      ...base.accounts,
      active: [accountWithOperations],
    },
  };
}

const operation = accountWithOperations.operations[1];

const mockNavigate = jest.fn();
const mockSetOptions = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const Stack = createNativeStackNavigator<OperationsHistoryNavigatorParamsList>();

const MockNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name={ScreenName.OperationsList} component={OperationsList} />
  </Stack.Navigator>
);

type OperationsListProps = React.ComponentProps<typeof OperationsList>;

const operationsListRoute = {
  key: ScreenName.OperationsList,
  name: ScreenName.OperationsList,
  params: undefined,
} as OperationsListProps["route"];

const renderOperationsListWithNavigation = (
  navigation: Partial<OperationsListProps["navigation"]>,
  options?: Parameters<typeof render>[1],
) =>
  render(
    <OperationsList
      route={operationsListRoute}
      navigation={navigation as OperationsListProps["navigation"]}
    />,
    options,
  );

const renderOperationsListWithParams = (
  params: NonNullable<OperationsListProps["route"]["params"]>,
  options?: Parameters<typeof render>[1],
) =>
  render(
    <OperationsList
      route={{ ...operationsListRoute, params } as OperationsListProps["route"]}
      navigation={
        {
          setOptions: mockSetOptions,
          dispatch: jest.fn(),
        } as unknown as OperationsListProps["navigation"]
      }
    />,
    options,
  );

describe("OperationsList", () => {
  beforeEach(() => {
    mockSetOptions.mockClear();
  });

  it("should track the OperationsList screen when it receives focus", () => {
    render(<MockNavigator />);
    expect(screen).toHaveBeenCalledWith(
      undefined,
      "OperationsList",
      { has_pending_operations: false },
      true,
      true,
      false,
      false,
    );
  });

  it("should not register the options menu when dust filtering is disabled", () => {
    renderOperationsListWithNavigation({ setOptions: mockSetOptions });

    expect(mockSetOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        lumenNavBar: expect.objectContaining({
          renderTrailing: undefined,
        }),
      }),
    );
  });

  it("should register the options menu when dust filtering is enabled", () => {
    renderOperationsListWithNavigation(
      { setOptions: mockSetOptions },
      {
        overrideInitialState: withFlagOverrides({
          lwmDustFiltering: {
            enabled: true,
          },
        }),
      },
    );

    expect(mockSetOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        lumenNavBar: expect.objectContaining({
          renderTrailing: expect.any(Function),
        }),
      }),
    );
  });

  it("should show Card history without crypto controls when Card is selected", async () => {
    const { getByTestId, queryByTestId, user } = renderOperationsListWithNavigation(
      { setOptions: mockSetOptions, dispatch: jest.fn() },
      {
        overrideInitialState: withFlagOverrides(
          {
            lwmDustFiltering: { enabled: true },
            lwmPayTab: { enabled: true },
          },
          stateWithAccountsAndOperations,
        ),
      },
    );

    jest.mocked(track).mockClear();
    await user.press(getByTestId("history-tab-card"));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "card",
      page: "OperationsList",
    });
    expect(getByTestId("card-history-signed-out-state")).toBeVisible();
    expect(queryByTestId("operations-list-section-list")).not.toBeOnTheScreen();
    expect(queryByTestId("bottom-fade-gradient")).not.toBeOnTheScreen();
    await waitFor(() =>
      expect(mockSetOptions).toHaveBeenLastCalledWith(
        expect.objectContaining({
          lumenNavBar: expect.objectContaining({
            renderTrailing: undefined,
          }),
        }),
      ),
    );
  });

  it("should scope the existing Card history when an asset is provided", async () => {
    const route = {
      ...operationsListRoute,
      params: { historyTab: "card", asset: "usdc" },
    } as OperationsListProps["route"];

    const { getByTestId, queryByTestId } = render(
      <OperationsList
        route={route}
        navigation={
          {
            setOptions: mockSetOptions,
            dispatch: jest.fn(),
          } as unknown as OperationsListProps["navigation"]
        }
      />,
      {
        overrideInitialState: withFlagOverrides({
          lwmPayTab: { enabled: true },
        }),
      },
    );

    await waitFor(() =>
      expect(mockSetOptions).toHaveBeenLastCalledWith(
        expect.objectContaining({
          lumenNavBar: expect.objectContaining({
            description: "Card · USDC",
            navBarDescriptionProps: { testID: "card-history-asset-scope" },
          }),
        }),
      ),
    );
    expect(getByTestId("card-history-signed-out-state")).toBeVisible();
    expect(queryByTestId("history-type-switcher")).not.toBeOnTheScreen();
  });

  it("should show scoped Card history when navigation updates an existing history screen", async () => {
    const navigation = {
      setOptions: mockSetOptions,
      dispatch: jest.fn(),
    } as unknown as OperationsListProps["navigation"];
    const view = render(<OperationsList route={operationsListRoute} navigation={navigation} />, {
      overrideInitialState: withFlagOverrides({
        lwmPayTab: { enabled: true },
      }),
    });
    const cardRoute = {
      ...operationsListRoute,
      params: { historyTab: "card", asset: "usdc" },
    } as OperationsListProps["route"];

    view.rerender(<OperationsList route={cardRoute} navigation={navigation} />);

    await waitFor(() => expect(view.getByTestId("card-history-signed-out-state")).toBeVisible());
    expect(view.queryByTestId("history-type-switcher")).not.toBeOnTheScreen();
  });

  describe("card history access", () => {
    it("should show crypto history when a card param arrives while the Pay tab is disabled", () => {
      const { getByTestId, queryByTestId } = renderOperationsListWithParams(
        { historyTab: "card" },
        { overrideInitialState: stateWithAccountsAndOperations },
      );

      expect(getByTestId("operations-list-section-list")).toBeVisible();
      expect(queryByTestId("card-history-signed-out-state")).not.toBeOnTheScreen();
      expect(queryByTestId("history-type-switcher")).not.toBeOnTheScreen();
    });

    it("should show Card history when an asset scopes the route while the Pay tab is disabled", async () => {
      const { getByTestId, queryByTestId } = renderOperationsListWithParams({
        historyTab: "card",
        asset: "usdc",
      });

      await waitFor(() => expect(getByTestId("card-history-signed-out-state")).toBeVisible());
      expect(queryByTestId("operations-list-section-list")).not.toBeOnTheScreen();
    });

    it("should show crypto history when an account-scoped route carries a card param", () => {
      const { getByTestId, queryByTestId } = renderOperationsListWithParams(
        { historyTab: "card", accountIds: [accountWithOperations.id] },
        {
          overrideInitialState: withFlagOverrides(
            { lwmPayTab: { enabled: true } },
            stateWithAccountsAndOperations,
          ),
        },
      );

      expect(getByTestId("operations-list-section-list")).toBeVisible();
      expect(queryByTestId("card-history-signed-out-state")).not.toBeOnTheScreen();
      expect(queryByTestId("history-type-switcher")).not.toBeOnTheScreen();
    });
  });

  describe("when the list is empty", () => {
    it("should render the empty state when no operations exist", () => {
      const { getByTestId } = render(<MockNavigator />);
      expect(getByTestId("operations-empty-state")).toBeVisible();
    });

    it("should block scrolling when no operations exist", () => {
      const { getByTestId } = render(<MockNavigator />);
      expect(getByTestId("operations-list-section-list")).toHaveProp("scrollEnabled", false);
    });

    it("should hide the bottom fade when no operations exist", () => {
      const { queryByTestId } = render(<MockNavigator />);
      expect(queryByTestId("bottom-fade-gradient")).not.toBeVisible();
    });
  });

  describe("when the list is not empty", () => {
    const renderWithOperations = () =>
      render(<MockNavigator />, {
        overrideInitialState: stateWithAccountsAndOperations,
      });

    it("should render the operation list when operations exist", () => {
      const { getByTestId, queryByTestId, getAllByTestId } = renderWithOperations();
      expect(getByTestId("operations-list-section-list")).toBeVisible();
      expect(queryByTestId("operations-empty-state")).not.toBeVisible();
      expect(getByTestId("bottom-fade-gradient")).toBeVisible();
      expect(getAllByTestId("operations-section-header")).toHaveLength(2);
    });

    it("should render every operation when operations exist", () => {
      const { getAllByTestId } = renderWithOperations();
      expect(getAllByTestId("operations-list-item")).toHaveLength(5);
    });

    it("should track and navigate when an operation is pressed", async () => {
      mockNavigate.mockClear();
      const { queryAllByTestId, user } = renderWithOperations();
      const operationItems = queryAllByTestId("operations-list-item");
      await user.press(operationItems[1]);

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(ScreenName.OperationDetails, {
        accountId: accountWithOperations.id,
        parentId: undefined,
        operation,
        key: operation.id,
      });
      expect(track).toHaveBeenCalledWith("transaction_clicked", {
        transaction: operation.type,
      });
    });
  });
});
