import { selectPayCardIsUsEnv } from "../providerAppSelectors";
import {
  payCardProviderAppInitialState,
  payCardProviderAppSlice,
  restorePayCardProviderApp,
  setPayCardProviderAppId,
} from "../providerAppSlice";

const reducer = payCardProviderAppSlice.reducer;

const stateWith = (providerAppId: string | null) => ({ payCardProviderApp: { providerAppId } });

describe("selectPayCardIsUsEnv", () => {
  it("names the US tenant when the stored app id is the US one", () => {
    expect(selectPayCardIsUsEnv(stateWith("ledger-us"), "ledger-us")).toBe(true);
  });

  it("names no tenant when the stored app id is another one", () => {
    expect(selectPayCardIsUsEnv(stateWith("ledger-uat"), "ledger-us")).toBe(false);
  });

  it("names no tenant when the US app id is not configured", () => {
    // The shipped default is an empty string, and a redirect that carried no app id stores null.
    // Neither names a tenant, so they must not match each other.
    expect(selectPayCardIsUsEnv(stateWith(null), "")).toBe(false);
    expect(selectPayCardIsUsEnv(stateWith(""), "")).toBe(false);
  });
});

describe("payCardProviderAppSlice", () => {
  it("stores the app id the redirect named", () => {
    const state = reducer(payCardProviderAppInitialState, setPayCardProviderAppId("ledger-us"));

    expect(state.providerAppId).toBe("ledger-us");
  });

  it("forgets the app id when a redirect named none", () => {
    const stored = reducer(payCardProviderAppInitialState, setPayCardProviderAppId("ledger-us"));

    expect(reducer(stored, setPayCardProviderAppId(null)).providerAppId).toBeNull();
  });

  it("restores the app id from a stored blob", () => {
    const state = reducer(
      payCardProviderAppInitialState,
      restorePayCardProviderApp({ providerAppId: "ledger-us" }),
    );

    expect(state.providerAppId).toBe("ledger-us");
  });

  it("stays at its initial state when an older blob carries no app id", () => {
    const state = reducer(payCardProviderAppInitialState, restorePayCardProviderApp({}));

    expect(state.providerAppId).toBeNull();
  });
});
