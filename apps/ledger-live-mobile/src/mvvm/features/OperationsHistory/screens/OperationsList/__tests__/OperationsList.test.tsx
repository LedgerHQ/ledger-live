import React from "react";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { render } from "@tests/test-renderer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { screen, track } from "~/analytics";
import type { OperationsHistoryNavigatorParamsList } from "LLM/features/OperationsHistory/types";
import type { State } from "~/reducers/types";
import { ScreenName } from "~/const/navigation";
import OperationsList from "../index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";

const accountWithOperations = genAccount("operations-list-non-empty", {
  currency: getCryptoCurrencyById("bitcoin"),
  operationsSize: 5,
});

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
    expect(screen).toHaveBeenCalledWith(undefined, "OperationsList", {}, true, true, false, false);
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

    it("renders the list", () => {
      const { getByTestId } = renderWithOperations();
      expect(getByTestId("operations-list-section-list")).toBeVisible();
    });

    it("doesn't render the empty state", () => {
      const { queryByTestId } = renderWithOperations();
      expect(queryByTestId("operations-empty-state")).not.toBeVisible();
    });

    it("renders the bottom fade gradient", () => {
      const { getByTestId } = renderWithOperations();
      expect(getByTestId("bottom-fade-gradient")).toBeVisible();
    });

    it("renders the section headers", () => {
      const { getByTestId } = renderWithOperations();
      expect(getByTestId("operations-section-header")).toBeVisible();
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
