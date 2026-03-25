import reducer, { INITIAL_STATE, earnInfoBottomSheetSelector } from "../earn";
import { makeSetEarnInfoBottomSheetAction } from "../../actions/earn";
import type { State } from "../types";

describe("earn reducer", () => {
  describe("EARN_INFO_BOTTOM_SHEET", () => {
    it("should set infoBottomSheet from payload", () => {
      const payload = { message: "Earn info", title: "Info" };
      const action = makeSetEarnInfoBottomSheetAction(payload);
      const state = reducer(INITIAL_STATE, action);

      expect(state.infoBottomSheet).toEqual(payload);
    });

    it("should set infoBottomSheet to undefined when payload is undefined", () => {
      const action = makeSetEarnInfoBottomSheetAction(undefined);
      const state = reducer(INITIAL_STATE, action);

      expect(state.infoBottomSheet).toBeUndefined();
    });

    it("should preserve other earn state when updating infoBottomSheet", () => {
      const baseState = {
        ...INITIAL_STATE,
        infoModal: { messageTitle: "Modal" },
      };
      const payload = { title: "Sheet", message: "Sheet message" };
      const action = makeSetEarnInfoBottomSheetAction(payload);
      const state = reducer(baseState, action);

      expect(state.infoBottomSheet).toEqual(payload);
      expect(state.infoModal).toEqual({ messageTitle: "Modal" });
    });
  });
});

describe("earnInfoBottomSheetSelector", () => {
  it("should return infoBottomSheet from earn state", () => {
    const infoBottomSheet = { message: "Test", title: "Test Title" };
    const state: State = {
      ...({} as State),
      earn: {
        ...INITIAL_STATE,
        infoBottomSheet,
      },
    };

    expect(earnInfoBottomSheetSelector(state)).toEqual(infoBottomSheet);
  });

  it("should return undefined when infoBottomSheet is initial", () => {
    const state: State = {
      ...({} as State),
      earn: INITIAL_STATE,
    };

    expect(earnInfoBottomSheetSelector(state)).toBeUndefined();
  });
});
