import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { setSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import type { Account } from "@ledgerhq/types-live";
import { renderHook, act } from "@tests/test-renderer";
import {
  accountsSelector,
  accountsCountSelector,
  hasNoAccountsSelector,
  useAreAccountsEmpty,
} from "../accounts";
import type { State } from "../types";

setSupportedCurrencies(["bitcoin", "ethereum"]);

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");

const BTC_FUNDED = genAccount("accounts-test-btc", { currency: bitcoin, operationsSize: 3 });
const ETH_EMPTY = genAccount("accounts-test-eth-empty", {
  currency: ethereum,
  operationsSize: 0,
});

function withAccounts(active: Account[]) {
  return (state: State): State => ({ ...state, accounts: { active } });
}

describe("accountsSelector / accountsCountSelector / hasNoAccountsSelector", () => {
  it("returns the active accounts and derived counts", () => {
    const state = {
      accounts: { active: [BTC_FUNDED, ETH_EMPTY] },
    } as unknown as State;

    expect(accountsSelector(state)).toEqual([BTC_FUNDED, ETH_EMPTY]);
    expect(accountsCountSelector(state)).toBe(2);
    expect(hasNoAccountsSelector(state)).toBe(false);
  });

  it("hasNoAccountsSelector returns true when there are no accounts", () => {
    const state = { accounts: { active: [] } } as unknown as State;
    expect(hasNoAccountsSelector(state)).toBe(true);
  });
});

describe("useAreAccountsEmpty", () => {
  it("returns true when every account is empty", () => {
    const { result } = renderHook(() => useAreAccountsEmpty(), {
      overrideInitialState: withAccounts([ETH_EMPTY]),
    });

    expect(result.current).toBe(true);
  });

  it("returns false when at least one account has operations", () => {
    const { result } = renderHook(() => useAreAccountsEmpty(), {
      overrideInitialState: withAccounts([BTC_FUNDED, ETH_EMPTY]),
    });

    expect(result.current).toBe(false);
  });

  it("returns true when there are no accounts", () => {
    const { result } = renderHook(() => useAreAccountsEmpty(), {
      overrideInitialState: withAccounts([]),
    });

    expect(result.current).toBe(true);
  });

  it("does not re-render the consumer when an unrelated state slice updates", () => {
    let renderCount = 0;
    const { store } = renderHook(
      () => {
        renderCount += 1;
        return useAreAccountsEmpty();
      },
      {
        overrideInitialState: withAccounts([ETH_EMPTY]),
      },
    );

    const initial = renderCount;

    act(() => {
      store.dispatch({
        type: "SETTINGS_SET_THEME",
        payload: "light",
      });
    });

    expect(renderCount).toBe(initial);
  });
});
