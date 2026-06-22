import reducer, {
  INITIAL_STATE,
  borrowInfoBottomSheetSelector,
  borrowErrorBottomSheetSelector,
  setInfoBottomSheet,
  setErrorBottomSheet,
} from "../borrow";
import type { State } from "../types";

describe("borrow slice", () => {
  describe("setInfoBottomSheet", () => {
    it("sets infoBottomSheet from payload", () => {
      const payload = { title: "Borrow info", message: "Some help text" };
      const state = reducer(INITIAL_STATE, setInfoBottomSheet(payload));

      expect(state.infoBottomSheet).toEqual(payload);
    });

    it("clears infoBottomSheet when payload is undefined", () => {
      const seeded = reducer(INITIAL_STATE, setInfoBottomSheet({ title: "Info", message: "Help" }));
      const state = reducer(seeded, setInfoBottomSheet(undefined));

      expect(state.infoBottomSheet).toBeUndefined();
    });
  });

  describe("setErrorBottomSheet", () => {
    const payload = {
      title: "Borrow failed",
      description: "The provider rejected your request.",
      ctaLabel: "Retry",
    };

    it("sets errorBottomSheet from payload", () => {
      const state = reducer(INITIAL_STATE, setErrorBottomSheet(payload));

      expect(state.errorBottomSheet).toEqual(payload);
    });

    it("clears errorBottomSheet when payload is undefined", () => {
      const seeded = reducer(INITIAL_STATE, setErrorBottomSheet(payload));
      const state = reducer(seeded, setErrorBottomSheet(undefined));

      expect(state.errorBottomSheet).toBeUndefined();
    });

    it("preserves infoBottomSheet when updating errorBottomSheet", () => {
      const infoPayload = { title: "Info", message: "Help" };
      const baseState = reducer(INITIAL_STATE, setInfoBottomSheet(infoPayload));
      const state = reducer(baseState, setErrorBottomSheet(payload));

      expect(state.infoBottomSheet).toEqual(infoPayload);
      expect(state.errorBottomSheet).toEqual(payload);
    });

    it("preserves errorBottomSheet when updating infoBottomSheet", () => {
      const infoPayload = { title: "Info", message: "Help" };
      const baseState = reducer(INITIAL_STATE, setErrorBottomSheet(payload));
      const state = reducer(baseState, setInfoBottomSheet(infoPayload));

      expect(state.infoBottomSheet).toEqual(infoPayload);
      expect(state.errorBottomSheet).toEqual(payload);
    });
  });
});

describe("borrowInfoBottomSheetSelector", () => {
  it("returns infoBottomSheet from borrow state", () => {
    const infoBottomSheet = { title: "Info", message: "Help" };
    const state: State = {
      ...({} as State),
      borrow: { ...INITIAL_STATE, infoBottomSheet },
    };

    expect(borrowInfoBottomSheetSelector(state)).toEqual(infoBottomSheet);
  });

  it("returns undefined when infoBottomSheet is initial", () => {
    const state: State = {
      ...({} as State),
      borrow: INITIAL_STATE,
    };

    expect(borrowInfoBottomSheetSelector(state)).toBeUndefined();
  });
});

describe("borrowErrorBottomSheetSelector", () => {
  it("returns errorBottomSheet from borrow state", () => {
    const errorBottomSheet = {
      title: "Borrow failed",
      description: "Reason",
      ctaLabel: "Retry",
    };
    const state: State = {
      ...({} as State),
      borrow: { ...INITIAL_STATE, errorBottomSheet },
    };

    expect(borrowErrorBottomSheetSelector(state)).toEqual(errorBottomSheet);
  });

  it("returns undefined when errorBottomSheet is initial", () => {
    const state: State = {
      ...({} as State),
      borrow: INITIAL_STATE,
    };

    expect(borrowErrorBottomSheetSelector(state)).toBeUndefined();
  });
});
