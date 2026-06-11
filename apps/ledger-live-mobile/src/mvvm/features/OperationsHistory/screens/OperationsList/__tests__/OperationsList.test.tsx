import React from "react";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account } from "@ledgerhq/types-live";
import { render } from "@tests/test-renderer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { screen, track } from "~/analytics";
import type { OperationsHistoryNavigatorParamsList } from "LLM/features/OperationsHistory/types";
import type { State } from "~/reducers/types";
import { ScreenName } from "~/const/navigation";
import OperationsList from "../index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";

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

describe("OperationsList", () => {
  it("tracks the OperationsList screen on focus", () => {
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

  describe("when the list is empty", () => {
    it("renders the empty state", () => {
      const { getByTestId } = render(<MockNavigator />);
      expect(getByTestId("operations-empty-state")).toBeVisible();
    });

    it("blocks the swipe", () => {
      const { getByTestId } = render(<MockNavigator />);
      expect(getByTestId("operations-list-section-list")).toHaveProp("scrollEnabled", false);
    });

    it("doesn't render the bottom fade gradient", () => {
      const { queryByTestId } = render(<MockNavigator />);
      expect(queryByTestId("bottom-fade-gradient")).not.toBeVisible();
    });
  });

  describe("when the list is not empty", () => {
    const renderWithOperations = () =>
      render(<MockNavigator />, { overrideInitialState: stateWithAccountsAndOperations });

    it("renders the list with correct components", () => {
      const { getByTestId, queryByTestId, getAllByTestId } = renderWithOperations();
      expect(getByTestId("operations-list-section-list")).toBeVisible();
      expect(queryByTestId("operations-empty-state")).not.toBeVisible();
      expect(getByTestId("bottom-fade-gradient")).toBeVisible();
      expect(getAllByTestId("operations-section-header")).toHaveLength(2);
    });

    it("renders five items", () => {
      const { getAllByTestId } = renderWithOperations();
      expect(getAllByTestId("operations-list-item")).toHaveLength(5);
    });

    it("triggers analytics and navigation when an item is pressed", async () => {
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
