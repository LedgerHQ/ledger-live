import reducer, {
  INITIAL_STATE,
  setPortfolioBalanceDisplay,
  selectPortfolioBalanceDisplay,
} from "../portfolioBalanceDisplay";
import type { State } from "../types";

describe("portfolioBalanceDisplay reducer", () => {
  it("has correct initial state", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual(INITIAL_STATE);
  });

  it("setPortfolioBalanceDisplay updates all fields", () => {
    const payload = { displayedBalance: 42000, isLoading: true, isBalanceAvailable: true };
    const state = reducer(INITIAL_STATE, setPortfolioBalanceDisplay(payload));

    expect(state).toEqual(payload);
  });

  it("setPortfolioBalanceDisplay with isLoading false and balance unavailable", () => {
    const payload = { displayedBalance: 0, isLoading: false, isBalanceAvailable: false };
    const state = reducer(INITIAL_STATE, setPortfolioBalanceDisplay(payload));

    expect(state).toEqual(payload);
  });

  it("does not mutate initial state", () => {
    const payload = { displayedBalance: 999, isLoading: false, isBalanceAvailable: true };
    reducer(INITIAL_STATE, setPortfolioBalanceDisplay(payload));

    expect(INITIAL_STATE.displayedBalance).toBe(0);
  });
});

describe("selectPortfolioBalanceDisplay", () => {
  it("returns the portfolioBalanceDisplay slice", () => {
    const mockState = {
      portfolioBalanceDisplay: {
        displayedBalance: 12345,
        isLoading: false,
        isBalanceAvailable: true,
      },
    } as unknown as State;

    expect(selectPortfolioBalanceDisplay(mockState)).toEqual({
      displayedBalance: 12345,
      isLoading: false,
      isBalanceAvailable: true,
    });
  });

  it("returns initial state when slice is at default", () => {
    const mockState = {
      portfolioBalanceDisplay: INITIAL_STATE,
    } as unknown as State;

    expect(selectPortfolioBalanceDisplay(mockState)).toEqual(INITIAL_STATE);
  });
});
