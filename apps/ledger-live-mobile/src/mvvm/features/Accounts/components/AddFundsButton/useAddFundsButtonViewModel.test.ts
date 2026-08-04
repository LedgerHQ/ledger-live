import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { act, renderHook } from "@tests/test-renderer";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import useAddFundsButtonViewModel from "./useAddFundsButtonViewModel";

const navigate = jest.fn();
let parentState: { routeNames: string[] } | undefined;

// Only `useNavigation` is overridden; every other export stays the real
// implementation so the test-renderer's NavigationContainer keeps working.
jest.mock("@react-navigation/core", () => ({
  ...jest.requireActual("@react-navigation/core"),
  useNavigation: () => ({
    navigate,
    getParent: () => ({ getState: () => parentState }),
  }),
}));

const currency = getCryptoCurrencyById("bitcoin");

const createAccount = (id: string): Account => {
  const balance = new BigNumber(0);
  return {
    type: "Account",
    id,
    seedIdentifier: "seed",
    derivationMode: "",
    index: 0,
    freshAddress: "addr",
    freshAddressPath: "44/0",
    used: true,
    balance,
    spendableBalance: balance,
    creationDate: new Date(),
    blockHeight: 0,
    currency,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
    swapHistory: [],
    subAccounts: [],
  };
};

const render = (accounts: Account[]) =>
  renderHook(() =>
    useAddFundsButtonViewModel({ accounts, currency, sourceScreenName: "Accounts" }),
  );

describe("useAddFundsButtonViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    parentState = undefined;
  });

  it("preselects the single account and opens quick actions when there is one account", () => {
    const account = createAccount("acc-1");
    const { result } = render([account]);

    expect(result.current.selectedAccount).toBe(account);

    act(() => result.current.openFundOrAccountListDrawer());

    expect(result.current.isAccountQuickActionsDrawerOpen).toBe(true);
    expect(result.current.isAccountListDrawerOpen).toBe(false);
    expect(track).toHaveBeenCalled();
  });

  it("opens the account list drawer when there are multiple accounts", () => {
    const { result } = render([createAccount("acc-1"), createAccount("acc-2")]);

    expect(result.current.selectedAccount).toBeNull();

    act(() => result.current.openFundOrAccountListDrawer());

    expect(result.current.isAccountListDrawerOpen).toBe(true);
    expect(result.current.isAccountQuickActionsDrawerOpen).toBe(false);
  });

  it("navigates directly to receive confirmation when in the onboarding flow", () => {
    parentState = { routeNames: [NavigatorName.Onboarding] };
    const account = createAccount("acc-1");
    const { result } = render([account]);

    act(() => result.current.openFundOrAccountListDrawer());

    expect(navigate).toHaveBeenCalledWith(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveConfirmation,
      params: { currency, accountId: account.id },
    });
    expect(track).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ flow: "onboarding" }),
    );
  });

  it("closes the account list drawer and tracks the close event", () => {
    const { result } = render([createAccount("acc-1"), createAccount("acc-2")]);

    act(() => result.current.openFundOrAccountListDrawer());
    act(() => result.current.closeAccountListDrawer());

    expect(result.current.isAccountListDrawerOpen).toBe(false);
    expect(track).toHaveBeenCalled();
  });

  it("selects an account from the list and opens the quick actions drawer", () => {
    const { result } = render([createAccount("acc-1"), createAccount("acc-2")]);
    const chosen = createAccount("acc-3");

    act(() => result.current.handleOnSelectAccount(chosen));

    expect(result.current.selectedAccount).toBe(chosen);
    expect(result.current.isAccountListDrawerOpen).toBe(false);
    expect(result.current.isAccountQuickActionsDrawerOpen).toBe(true);
  });

  it("closes the quick actions drawer and tracks the close event", () => {
    const account = createAccount("acc-1");
    const { result } = render([account]);

    act(() => result.current.openFundOrAccountListDrawer());
    act(() => result.current.handleOnCloseQuickActions());

    expect(result.current.isAccountQuickActionsDrawerOpen).toBe(false);
    expect(track).toHaveBeenCalled();
  });
});
