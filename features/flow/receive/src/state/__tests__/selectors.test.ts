import {
  markReceiveVerifyHintSeen,
  receiveVerifyHintInitialState,
  receiveVerifyHintSlice,
} from "../slice";
import { receiveVerifyHintPersistedSelector, selectHasSeenReceiveVerifyHint } from "../selectors";

const reducer = receiveVerifyHintSlice.reducer;
const root = (state = receiveVerifyHintInitialState) => ({ receiveVerifyHint: state });

describe("receiveVerifyHint selectors", () => {
  it("selectHasSeenReceiveVerifyHint reflects whether the hint was seen", () => {
    expect(selectHasSeenReceiveVerifyHint(root())).toBe(false);
    expect(
      selectHasSeenReceiveVerifyHint(root(reducer(undefined, markReceiveVerifyHintSeen()))),
    ).toBe(true);
  });

  it("receiveVerifyHintPersistedSelector returns the slice", () => {
    const state = reducer(undefined, markReceiveVerifyHintSeen());
    expect(receiveVerifyHintPersistedSelector(root(state))).toEqual({
      hasSeenReceiveVerifyHint: true,
    });
  });
});
