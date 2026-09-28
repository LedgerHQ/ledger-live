import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { act, renderHook } from "@tests/test-renderer";
import { addOneAccount, updateAccountWithUpdater } from "~/actions/accounts";
import type { State } from "~/reducers/types";
import { useBrazeEligibilityContext } from "./useBrazeEligibilityContext";

const bitcoin = getCryptoCurrencyById("bitcoin");
const BTC_FUNDED = genAccount("braze-eligibility-context-btc", {
  currency: bitcoin,
  operationsSize: 3,
});

function withAccounts(active: Account[]) {
  return (state: State): State => ({ ...state, accounts: { active } });
}

describe("useBrazeEligibilityContext", () => {
  it("should report hasFunds when at least one account is funded", () => {
    const { result } = renderHook(() => useBrazeEligibilityContext(), {
      overrideInitialState: withAccounts([BTC_FUNDED]),
    });

    expect(result.current).toEqual({
      hasFunds: true,
      isOnboarded: false,
      hasStax: false,
    });
  });

  it("should not re-render when a funded account syncs", () => {
    let renderCount = 0;
    const { result, store } = renderHook(
      () => {
        renderCount += 1;
        return useBrazeEligibilityContext();
      },
      {
        overrideInitialState: withAccounts([BTC_FUNDED]),
      },
    );

    const firstContext = result.current;
    const initialRenderCount = renderCount;

    act(() => {
      store.dispatch(
        updateAccountWithUpdater({
          accountId: BTC_FUNDED.id,
          updater: account => ({
            ...account,
            operationsCount: account.operationsCount + 1,
          }),
        }),
      );
    });

    expect(renderCount).toBe(initialRenderCount);
    expect(result.current).toBe(firstContext);
    expect(result.current.hasFunds).toBe(true);
  });

  it("should flip hasFunds when a funded account is added", () => {
    const { result, store } = renderHook(() => useBrazeEligibilityContext(), {
      overrideInitialState: withAccounts([]),
    });

    expect(result.current.hasFunds).toBe(false);

    act(() => {
      store.dispatch(addOneAccount(BTC_FUNDED));
    });

    expect(result.current.hasFunds).toBe(true);
  });
});
