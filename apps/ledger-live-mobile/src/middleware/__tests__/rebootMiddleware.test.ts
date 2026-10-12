import { configureStore, Middleware } from "@reduxjs/toolkit";
import { rebootMiddleware } from "../rebootMiddleware";
import { reboot } from "~/actions/appstate";
import { setCountervaluesState, wipeCountervalues } from "@features/platform-market-countervalues";
import { AppStateActionTypes } from "~/actions/types";

function buildStore() {
  const dispatched: string[] = [];
  const recorder: Middleware = () => next => action => {
    if (action && typeof action === "object" && "type" in action) {
      dispatched.push((action as { type: string }).type);
    }
    return next(action);
  };
  const store = configureStore({
    reducer: (state = {}) => state,
    middleware: getDefault =>
      getDefault({ serializableCheck: false, immutableCheck: false }).concat(
        recorder,
        rebootMiddleware as Middleware,
      ),
  });
  return { store, dispatched };
}

describe("rebootMiddleware", () => {
  it("dispatches wipeCountervalues immediately after the reboot action", () => {
    const { store, dispatched } = buildStore();

    store.dispatch(reboot());

    expect(dispatched).toEqual([AppStateActionTypes.INCREMENT_REBOOT_ID, wipeCountervalues.type]);
  });

  it("does not dispatch wipeCountervalues for unrelated actions", () => {
    const { store, dispatched } = buildStore();

    store.dispatch(setCountervaluesState({} as never));

    expect(dispatched).not.toContain(wipeCountervalues.type);
  });
});
