import { restoreReceiveVerifyHint } from "@features/flow-receive/state";
import rootReducer from "..";

const initialState = () => rootReducer(undefined, { type: "@@INIT" });

describe("the receiveVerifyHint entry restored into the desktop store", () => {
  it("lands the persisted flag in the receiveVerifyHint slice", () => {
    const state = rootReducer(
      initialState(),
      restoreReceiveVerifyHint({ hasSeenReceiveVerifyHint: true }),
    );

    expect(state.receiveVerifyHint.hasSeenReceiveVerifyHint).toBe(true);
  });

  it("keeps the slice at its initial state when nothing was persisted yet", () => {
    const state = rootReducer(initialState(), restoreReceiveVerifyHint(undefined));

    expect(state.receiveVerifyHint.hasSeenReceiveVerifyHint).toBe(false);
  });
});
