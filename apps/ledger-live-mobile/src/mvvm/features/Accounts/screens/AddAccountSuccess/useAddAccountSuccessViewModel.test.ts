import { renderHook } from "@tests/test-renderer";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import { AddAccountContexts } from "../AddAccount/enums";
import useAddAccountSuccessViewModel, { Props } from "./useAddAccountSuccessViewModel";

const navigate = jest.fn();

jest.mock("@react-navigation/core", () => ({
  ...jest.requireActual("@react-navigation/core"),
  useNavigation: () => ({ navigate }),
}));

const makeProps = (params?: Record<string, unknown>) => ({ route: { params } }) as unknown as Props;

describe("useAddAccountSuccessViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("navigates to the account screen and tracks in the AddAccounts context", () => {
    const { result } = renderHook(() =>
      useAddAccountSuccessViewModel(makeProps({ context: AddAccountContexts.AddAccounts })),
    );

    result.current.goToAccounts("account-1")();

    expect(navigate).toHaveBeenCalledWith(ScreenName.Account, { accountId: "account-1" });
    expect(track).toHaveBeenCalled();
  });

  it("navigates to receive confirmation in the ReceiveFunds context, keeping route params", () => {
    const params = { context: AddAccountContexts.ReceiveFunds, currency: { id: "bitcoin" } };
    const { result } = renderHook(() => useAddAccountSuccessViewModel(makeProps(params)));

    result.current.goToAccounts("account-2")();

    expect(navigate).toHaveBeenCalledWith(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveConfirmation,
      params: { ...params, accountId: "account-2" },
    });
  });

  it("extracts the id from an item via keyExtractor", () => {
    const { result } = renderHook(() => useAddAccountSuccessViewModel(makeProps({})));

    expect(result.current.keyExtractor({ id: "abc" } as never)).toBe("abc");
  });

  it("passes through route params", () => {
    const accountsToAdd = [{ id: "a" }];
    const currency = { id: "bitcoin" };
    const onCloseNavigation = jest.fn();
    const { result } = renderHook(() =>
      useAddAccountSuccessViewModel(makeProps({ accountsToAdd, currency, onCloseNavigation })),
    );

    expect(result.current.accountsToAdd).toBe(accountsToAdd);
    expect(result.current.currency).toBe(currency);
    expect(result.current.onCloseNavigation).toBe(onCloseNavigation);
  });
});
