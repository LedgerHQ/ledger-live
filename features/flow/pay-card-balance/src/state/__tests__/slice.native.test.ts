import {
  payCardBalanceSlice,
  payCardBalanceInitialState,
  setPayCardBalanceFilter,
  restorePayCardBalanceFilter,
} from "../slice";
import { selectPayCardBalanceFilter, payCardBalancePersistedSelector } from "../selectors";
import { PAY_CARD_BALANCE_FILTER_ALL } from "../constants";

const reducer = payCardBalanceSlice.reducer;
const root = (state = payCardBalanceInitialState) => ({ payCardBalance: state });

describe("payCardBalance slice", () => {
  it("defaults the balance filter to all", () => {
    expect(reducer(undefined, { type: "unknown" })).toEqual(payCardBalanceInitialState);
    expect(payCardBalanceInitialState.balanceFilter).toBe(PAY_CARD_BALANCE_FILTER_ALL);
  });

  it("sets the balance filter to a stablecoin currencyId", () => {
    const state = reducer(undefined, setPayCardBalanceFilter("ethereum/erc20/usd__coin"));
    expect(state.balanceFilter).toBe("ethereum/erc20/usd__coin");
  });

  it("sets the balance filter back to all", () => {
    const filtered = reducer(undefined, setPayCardBalanceFilter("ethereum/erc20/usd__coin"));
    const state = reducer(filtered, setPayCardBalanceFilter(PAY_CARD_BALANCE_FILTER_ALL));
    expect(state.balanceFilter).toBe(PAY_CARD_BALANCE_FILTER_ALL);
  });
});

describe("restorePayCardBalanceFilter", () => {
  it("restores balanceFilter from a valid payload", () => {
    const state = reducer(
      undefined,
      restorePayCardBalanceFilter({ balanceFilter: "ethereum/erc20/usd__coin" }),
    );
    expect(state.balanceFilter).toBe("ethereum/erc20/usd__coin");
  });

  it("is a no-op when dispatched with an undefined payload (nothing persisted yet)", () => {
    const state = reducer(undefined, restorePayCardBalanceFilter(undefined));
    expect(state).toEqual(payCardBalanceInitialState);
  });

  it("ignores a non-string or empty balanceFilter", () => {
    const emptyString = reducer(undefined, restorePayCardBalanceFilter({ balanceFilter: "" }));
    expect(emptyString.balanceFilter).toBe(PAY_CARD_BALANCE_FILTER_ALL);

    const nonString = reducer(
      undefined,
      // @ts-expect-error - guarding against malformed persisted data
      restorePayCardBalanceFilter({ balanceFilter: 42 }),
    );
    expect(nonString.balanceFilter).toBe(PAY_CARD_BALANCE_FILTER_ALL);
  });
});

describe("payCardBalance selectors", () => {
  it("selectPayCardBalanceFilter reflects the current filter", () => {
    expect(selectPayCardBalanceFilter(root())).toBe(PAY_CARD_BALANCE_FILTER_ALL);
    expect(
      selectPayCardBalanceFilter(
        root(reducer(undefined, setPayCardBalanceFilter("ethereum/erc20/usd__coin"))),
      ),
    ).toBe("ethereum/erc20/usd__coin");
  });

  it("payCardBalancePersistedSelector returns only the persisted subset", () => {
    const state = reducer(undefined, setPayCardBalanceFilter("ethereum/erc20/usd__coin"));
    expect(payCardBalancePersistedSelector(root(state))).toEqual({
      balanceFilter: "ethereum/erc20/usd__coin",
    });
  });
});
