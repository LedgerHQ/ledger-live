import { renderHook } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import { State } from "~/reducers/types";
import { TrackingEvent } from "../../../../enums";
import useGenericAccountsListViewModel from "../useGenericAccountsListViewModel";
import type { Props } from "../useGenericAccountsListViewModel";
import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";

const mockUseGlobalSyncState = jest.fn();
jest.mock("@ledgerhq/live-common/bridge/react/useGlobalSyncState", () => ({
  useGlobalSyncState: () => mockUseGlobalSyncState(),
}));

const ethCurrency = getCryptoCurrencyById("ethereum");
const mockAccount = genAccount("generic-list-test", { currency: ethCurrency });

const makeRoute = (params: Record<string, unknown> = {}) =>
  ({
    route: {
      params: {
        sourceScreenName: ScreenName.AccountsList,
        ...params,
      },
    },
  }) as unknown as Props;

const stateWithAccounts = (hasAccounts = true) => ({
  overrideInitialState: (state: State) => ({
    ...state,
    accounts: {
      ...state.accounts,
      active: hasAccounts ? [mockAccount] : [],
    },
  }),
});

describe("useGenericAccountsListViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGlobalSyncState.mockReturnValue({ pending: false, error: null });
  });

  it("should parse canAddAccount=true from route params", () => {
    const { result } = renderHook(
      () => useGenericAccountsListViewModel(makeRoute({ canAddAccount: true })),
      stateWithAccounts(),
    );

    expect(result.current.canAddAccount).toBe(true);
  });

  it("should parse canAddAccount='true' from string params", () => {
    const { result } = renderHook(
      () => useGenericAccountsListViewModel(makeRoute({ canAddAccount: "true" })),
      stateWithAccounts(),
    );

    expect(result.current.canAddAccount).toBe(true);
  });

  it("should default canAddAccount to false when param missing", () => {
    const { result } = renderHook(
      () => useGenericAccountsListViewModel(makeRoute()),
      stateWithAccounts(),
    );

    expect(result.current.canAddAccount).toBe(false);
  });

  it("should set canAddAccount to false when hasNoAccount is true even if param is true", () => {
    const { result } = renderHook(
      () => useGenericAccountsListViewModel(makeRoute({ canAddAccount: true })),
      stateWithAccounts(false),
    );

    expect(result.current.canAddAccount).toBe(false);
    expect(result.current.hasNoAccount).toBe(true);
  });

  it("should parse showHeader and isSyncEnabled booleans", () => {
    const { result } = renderHook(
      () =>
        useGenericAccountsListViewModel(
          makeRoute({ showHeader: "true", isSyncEnabled: "true" }),
        ),
      stateWithAccounts(),
    );

    expect(result.current.showHeader).toBe(true);
    expect(result.current.isSyncEnabled).toBe(true);
  });

  it("should compute syncPending when globalSync pending and not up to date", () => {
    mockUseGlobalSyncState.mockReturnValue({ pending: true, error: null });

    const { result } = renderHook(
      () => useGenericAccountsListViewModel(makeRoute()),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: {
            ...state.accounts,
            active: [{ ...mockAccount, lastSyncDate: new Date(0) }],
          },
        }),
      },
    );

    expect(result.current.syncPending).toBe(true);
  });

  it("should not be syncPending when globalSync is not pending", () => {
    mockUseGlobalSyncState.mockReturnValue({ pending: false, error: null });

    const { result } = renderHook(
      () => useGenericAccountsListViewModel(makeRoute()),
      stateWithAccounts(),
    );

    expect(result.current.syncPending).toBe(false);
  });

  it("should use TrackingEvent.AccountsList as pageTrackingEvent", () => {
    const { result } = renderHook(
      () => useGenericAccountsListViewModel(makeRoute()),
      stateWithAccounts(),
    );

    expect(result.current.pageTrackingEvent).toBe(TrackingEvent.AccountsList);
  });

  it("should pass through sourceScreenName and specificAccounts from params", () => {
    const { result } = renderHook(
      () =>
        useGenericAccountsListViewModel(
          makeRoute({
            sourceScreenName: ScreenName.Assets,
            specificAccounts: [mockAccount],
          }),
        ),
      stateWithAccounts(),
    );

    expect(result.current.sourceScreenName).toBe(ScreenName.Assets);
    expect(result.current.specificAccounts).toEqual([mockAccount]);
  });
});
