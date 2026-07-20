import { payCardSlice, payCardInitialState, openPayCard, closePayCard } from "./slice";
import { selectPayCardLoginUrl } from "./selectors";

const reducer = payCardSlice.reducer;
const loginUrl = "https://card.withcl.com/login";
const root = (state = payCardInitialState) => ({ payCard: state });

describe("payCard slice", () => {
  it("initializes with no login URL", () => {
    expect(reducer(undefined, { type: "unknown" })).toEqual(payCardInitialState);
  });

  it("opens with the given login URL", () => {
    const state = reducer(undefined, openPayCard(loginUrl));
    expect(state).toEqual({ loginUrl });
  });

  it("closes and clears the login URL", () => {
    const opened = reducer(undefined, openPayCard(loginUrl));
    expect(reducer(opened, closePayCard())).toEqual(payCardInitialState);
  });
});

describe("payCard selectors", () => {
  it("selectPayCardLoginUrl returns the login URL", () => {
    expect(selectPayCardLoginUrl(root())).toBeNull();
    expect(selectPayCardLoginUrl(root(reducer(undefined, openPayCard(loginUrl))))).toBe(loginUrl);
  });
});
