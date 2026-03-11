import { renderHook } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import { State } from "~/reducers/types";
import { TrackingEvent } from "../../../../enums";
import useSpecificAccountsListViewModel from "../useSpecificAccountsListViewModel";
import type { Props } from "../useSpecificAccountsListViewModel";
import { genAccount, genTokenAccount } from "@ledgerhq/coin-framework/mocks/account";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { ethCurrency, btcCurrency, usdtToken } from "../../../../__tests__/shared";

const mockUseGlobalSyncState = jest.fn();
jest.mock("@ledgerhq/live-common/bridge/react/useGlobalSyncState", () => ({
  useGlobalSyncState: () => mockUseGlobalSyncState(),
}));

jest.mock("@ledgerhq/live-common/account/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/account/index"),
  getAccountCurrency: (account: Account | TokenAccount) =>
    account.type === "TokenAccount"
      ? (account as TokenAccount).token
      : (account as Account).currency,
}));

const ethAccount = genAccount("specific-list-eth", { currency: ethCurrency });
const btcAccount = genAccount("specific-list-btc", { currency: btcCurrency });

const makeTokenAccount = (): TokenAccount =>
  genTokenAccount(0, ethAccount, usdtToken);

const makeProps = (
  specificAccounts: Account[] | TokenAccount[],
  params: Record<string, unknown> = {},
) =>
  ({
    route: {
      params: {
        sourceScreenName: ScreenName.AccountsList,
        ...params,
      },
    },
    specificAccounts,
  }) as unknown as Props;

const stateWithAccounts = () => ({
  overrideInitialState: (state: State) => ({
    ...state,
    accounts: {
      ...state.accounts,
      active: [ethAccount, btcAccount],
    },
  }),
});

describe("useSpecificAccountsListViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGlobalSyncState.mockReturnValue({ pending: false, error: null });
  });

  it("should derive ticker from first specificAccount (Account type)", () => {
    const { result } = renderHook(
      () => useSpecificAccountsListViewModel(makeProps([ethAccount])),
      stateWithAccounts(),
    );

    expect(result.current.ticker).toBe("ETH");
  });

  it("should derive ticker from first specificAccount (TokenAccount type)", () => {
    const tokenAccount = makeTokenAccount();
    const { result } = renderHook(
      () => useSpecificAccountsListViewModel(makeProps([tokenAccount])),
      stateWithAccounts(),
    );

    expect(result.current.ticker).toBe("USDT");
  });

  it("should derive currency and currencyToTrack from first specificAccount", () => {
    const { result } = renderHook(
      () => useSpecificAccountsListViewModel(makeProps([btcAccount])),
      stateWithAccounts(),
    );

    expect(result.current.currency).toEqual(expect.objectContaining({ id: "bitcoin" }));
    expect(result.current.currencyToTrack).toBe("Bitcoin");
  });

  it("should use TrackingEvent.AccountListSummary as page tracking event", () => {
    const { result } = renderHook(
      () => useSpecificAccountsListViewModel(makeProps([ethAccount])),
      stateWithAccounts(),
    );

    expect(result.current.pageTrackingEvent).toBe(TrackingEvent.AccountListSummary);
  });

  it("should parse showHeader and canAddAccount from params", () => {
    const { result } = renderHook(
      () =>
        useSpecificAccountsListViewModel(
          makeProps([ethAccount], { showHeader: true, canAddAccount: true }),
        ),
      stateWithAccounts(),
    );

    expect(result.current.showHeader).toBe(true);
    expect(result.current.canAddAccount).toBe(true);
  });
});
