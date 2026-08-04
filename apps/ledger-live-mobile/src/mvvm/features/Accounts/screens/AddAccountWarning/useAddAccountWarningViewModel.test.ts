import { renderHook } from "@tests/test-renderer";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import { AddAccountContexts } from "../AddAccount/enums";
import useAddAccountWarningViewModel, { Props } from "./useAddAccountWarningViewModel";

const navigate = jest.fn();
const goBack = jest.fn();

jest.mock("@react-navigation/core", () => ({
  ...jest.requireActual("@react-navigation/core"),
  useNavigation: () => ({ navigate, goBack }),
}));

const makeProps = (params?: Record<string, unknown>) => ({ route: { params } }) as unknown as Props;

describe("useAddAccountWarningViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("navigates to the account screen and tracks in the AddAccounts context", () => {
    const { result } = renderHook(() =>
      useAddAccountWarningViewModel(makeProps({ context: AddAccountContexts.AddAccounts })),
    );

    result.current.goToAccounts("account-1")();

    expect(navigate).toHaveBeenCalledWith(ScreenName.Account, { accountId: "account-1" });
    expect(track).toHaveBeenCalled();
  });

  it("navigates to receive confirmation in the ReceiveFunds context, keeping route params", () => {
    const params = { context: AddAccountContexts.ReceiveFunds, currency: { id: "bitcoin" } };
    const { result } = renderHook(() => useAddAccountWarningViewModel(makeProps(params)));

    result.current.goToAccounts("account-2")();

    expect(navigate).toHaveBeenCalledWith(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveConfirmation,
      params: { ...params, accountId: "account-2" },
    });
  });

  it("calls the provided onCloseNavigation when closing", () => {
    const onCloseNavigation = jest.fn();
    const { result } = renderHook(() =>
      useAddAccountWarningViewModel(makeProps({ onCloseNavigation })),
    );

    result.current.handleOnCloseWarningScreen();

    expect(onCloseNavigation).toHaveBeenCalledTimes(1);
    expect(goBack).not.toHaveBeenCalled();
  });

  it("falls back to navigation.goBack when no onCloseNavigation is provided", () => {
    const { result } = renderHook(() => useAddAccountWarningViewModel(makeProps({})));

    result.current.handleOnCloseWarningScreen();

    expect(goBack).toHaveBeenCalledTimes(1);
  });
});
