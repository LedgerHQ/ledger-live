import { configureStore } from "@reduxjs/toolkit";
import { createLiveConfigOverridesMiddleware } from "./middleware";
import {
  liveConfigOverridesReducer,
  setAllLiveConfigOverrides,
  setLiveConfigOverride,
} from "./slice";

const createStore = (applyOverrides: (overrides: Record<string, unknown>) => void) =>
  configureStore({
    reducer: { liveConfigOverrides: liveConfigOverridesReducer },
    middleware: getDefault =>
      getDefault().concat(createLiveConfigOverridesMiddleware({ applyOverrides })),
  });

describe("createLiveConfigOverridesMiddleware", () => {
  it("applies the overrides when they change", () => {
    const applyOverrides = jest.fn();
    const store = createStore(applyOverrides);

    store.dispatch(setLiveConfigOverride({ key: "config_currency_solana", value: { a: 1 } }));

    expect(applyOverrides).toHaveBeenLastCalledWith({ config_currency_solana: { a: 1 } });
  });

  it("applies an emptied map when every override is restored", () => {
    const applyOverrides = jest.fn();
    const store = createStore(applyOverrides);
    store.dispatch(setLiveConfigOverride({ key: "config_currency_solana", value: { a: 1 } }));

    store.dispatch(setAllLiveConfigOverrides({}));

    expect(applyOverrides).toHaveBeenLastCalledWith({});
  });

  it("does not apply again for actions that leave the overrides unchanged", () => {
    const applyOverrides = jest.fn();
    const store = createStore(applyOverrides);
    store.dispatch(setLiveConfigOverride({ key: "config_currency_solana", value: { a: 1 } }));
    applyOverrides.mockClear();

    store.dispatch({ type: "unrelated/action" });

    expect(applyOverrides).not.toHaveBeenCalled();
  });
});
