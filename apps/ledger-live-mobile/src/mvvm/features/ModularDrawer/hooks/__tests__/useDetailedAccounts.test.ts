import { renderHook, act } from "@tests/test-renderer";
import { useDetailedAccounts } from "../useDetailedAccounts";
import { mockEthCryptoCurrency } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { ETH_ACCOUNT } from "@ledgerhq/live-common/modularDrawer/__mocks__/accounts.mock";
import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import BigNumber from "bignumber.js";
import { State } from "~/reducers/types";

describe("useDetailedAccounts", () => {
  it("should return an empty list when no accounts exist for the asset", () => {
    const { result } = renderHook(() =>
      useDetailedAccounts(mockEthCryptoCurrency, "test_flow", "test_source", undefined),
    );

    expect(result.current.detailedAccounts).toHaveLength(0);
  });

  it("should format balance with currency ticker and fiatValue as non-empty string", () => {
    const { result } = renderHook(
      () => useDetailedAccounts(mockEthCryptoCurrency, "test_flow", "test_source", undefined),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: { active: [ETH_ACCOUNT] },
        }),
      },
    );

    expect(result.current.detailedAccounts.length).toBeGreaterThan(0);
    const { balance, fiatValue } = result.current.detailedAccounts[0];
    expect(balance).toContain(mockEthCryptoCurrency.ticker);
    expect(fiatValue.trim().length).toBeGreaterThan(0);
  });

  it("should sort accounts by balance descending", () => {
    const highBalanceAccount = {
      ...genAccount("high_balance_eth", { currency: mockEthCryptoCurrency }),
      balance: new BigNumber("1000000000000000000000"),
    };
    const lowBalanceAccount = {
      ...genAccount("low_balance_eth", { currency: mockEthCryptoCurrency }),
      balance: new BigNumber("1"),
    };

    const { result } = renderHook(
      () => useDetailedAccounts(mockEthCryptoCurrency, "test_flow", "test_source", undefined),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: { active: [lowBalanceAccount, highBalanceAccount] },
        }),
      },
    );

    expect(result.current.accounts).toHaveLength(2);
    expect(
      result.current.accounts[0].account.balance.isGreaterThanOrEqualTo(
        result.current.accounts[1].account.balance,
      ),
    ).toBe(true);
  });

  it("should forward account and parentAccount to onAccountSelected", () => {
    const onAccountSelected = jest.fn();
    const { result } = renderHook(
      () =>
        useDetailedAccounts(mockEthCryptoCurrency, "test_flow", "test_source", onAccountSelected),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: { active: [ETH_ACCOUNT] },
        }),
      },
    );

    const rawAccount = result.current.detailedAccounts[0];

    act(() => {
      result.current.handleAccountSelected(rawAccount);
    });

    expect(onAccountSelected).toHaveBeenCalledWith(rawAccount.account, rawAccount.parentAccount);
  });
});
