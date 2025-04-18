import { render } from "@tests/test-renderer";
import React from "react";
import EditAccountName from "../EditAccountName";
import { ScreenName } from "~/const";
import { AccountSettingsNavigatorParamList } from "~/components/RootNavigator/types/AccountSettingsNavigator";
import { RouteProp } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/live-common/mock/account";

jest.mock("react-redux", () => {
  const actual = jest.requireActual("react-redux");
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});

const mockDispatch = jest.fn();
const onAccountNameChange = jest.fn();

const mockedNavigation = {
  replace: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
  goBack: jest.fn(),
  navigate: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  isFocused: jest.fn(),
  canGoBack: jest.fn(),
  getId: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  setOptions: jest.fn(),
};

const genAcc = {
  ...genAccount("Acc1", { currency: getCryptoCurrencyById("bitcoin") }),
  index: 0,
};

const mockedRoute: RouteProp<AccountSettingsNavigatorParamList, ScreenName.EditAccountName> = {
  key: "EditAccountName",
  name: ScreenName.EditAccountName,
  params: { accountId: genAcc.id },
};

const Stack = createStackNavigator<
  BaseNavigatorStackParamList & AccountSettingsNavigatorParamList
>();

function EditAccountNameNavigator({ useAccount = false }: { useAccount?: boolean }) {
  const routeParams = useAccount
    ? { accountId: undefined, account: genAcc, onAccountNameChange }
    : { accountId: genAcc.id };

  return (
    <Stack.Navigator initialRouteName={ScreenName.EditAccountName}>
      <Stack.Screen name={ScreenName.EditAccountName}>
        {() => (
          <EditAccountName
            navigation={mockedNavigation}
            route={{ ...mockedRoute, params: routeParams }}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

const renderWithState = (useAccount = false) =>
  render(<EditAccountNameNavigator useAccount={useAccount} />, {
    overrideInitialState: state => ({
      ...state,
      accounts: { active: [genAcc] },
      wallet: { ...state.wallet, accountNames: new Map<string, string>() },
    }),
  });

describe("EditAccountName", () => {
  beforeEach(() => {
    mockDispatch.mockClear();
  });

  test("renders correctly with initial state", () => {
    const { getByTestId } = renderWithState();
    expect(getByTestId("account-rename-text-input").props.value).toBe("Bitcoin 1");
    expect(getByTestId("account-rename-apply")).toBeDefined();
  });

  test("updates account name on text input change", async () => {
    const { getByTestId, user } = renderWithState();
    const input = getByTestId("account-rename-text-input");
    await user.clear(input);
    await user.type(input, "New Account Name");
    expect(input.props.value).toBe("New Account Name");
  });

  test("dispatches actions and navigates back on valid name submission from AccountPage", async () => {
    const { getByTestId, user } = renderWithState();
    await user.clear(getByTestId("account-rename-text-input"));
    await user.type(getByTestId("account-rename-text-input"), "Updated Account Name");
    await user.press(getByTestId("account-rename-apply"));

    expect(mockDispatch).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        type: "UPDATE_ACCOUNT",
        payload: expect.objectContaining({ accountId: genAcc.id, updater: expect.any(Function) }),
      }),
    );

    expect(mockDispatch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: "SET_ACCOUNT_NAME",
        payload: { accountId: genAcc.id, name: "Updated Account Name" },
      }),
    );

    expect(mockedNavigation.goBack).toHaveBeenCalled();
  });

  test("calls onAccountNameChange and navigates back on submission from AddAccount", async () => {
    const { getByTestId, user } = renderWithState(true);
    await user.clear(getByTestId("account-rename-text-input"));
    await user.type(getByTestId("account-rename-text-input"), "Updated Account Name");
    await user.press(getByTestId("account-rename-apply"));

    expect(onAccountNameChange).toHaveBeenCalledWith("Updated Account Name", genAcc);
    expect(mockedNavigation.goBack).toHaveBeenCalled();
  });

  test("disables apply button when input is empty", async () => {
    const { getByTestId, user } = renderWithState();
    const input = getByTestId("account-rename-text-input");
    await user.clear(input);
    await user.type(input, " ");
    expect(getByTestId("account-rename-apply").props.accessibilityState.disabled).toBe(true);
  });
});
