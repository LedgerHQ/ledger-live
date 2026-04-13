import reducer, {
  INITIAL_STATE,
  earnInfoBottomSheetSelector,
  earnMenuBottomSheetSelector,
  earnActionDialogSelector,
} from "../earn";
import {
  makeSetEarnInfoBottomSheetAction,
  makeSetEarnMenuBottomSheetAction,
  makeSetEarnActionDialogAction,
} from "../../actions/earn";
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

  describe("EARN_MENU_BOTTOM_SHEET", () => {
    it("should set menuBottomSheet from payload", () => {
      const payload = [
        {
          icon: "Plus",
          label: "A",
          metadata: {
            button: "earn",
            live_app: "earn",
            flow: "deposit",
            link: "ledgerlive://earn",
          },
        },
      ];
      const action = makeSetEarnMenuBottomSheetAction(payload);
      const state = reducer(INITIAL_STATE, action);

      expect(state.menuBottomSheet).toEqual(payload);
    });

    it("should set menuBottomSheet to undefined when payload is undefined", () => {
      const action = makeSetEarnMenuBottomSheetAction(undefined);
      const state = reducer(INITIAL_STATE, action);

      expect(state.menuBottomSheet).toBeUndefined();
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

  describe("EARN_ACTION_DIALOG", () => {
    it("should set actionDialog from payload", () => {
      const payload = {
        title: "Swap required",
        description: "You need to swap before staking",
        ctaLabel: "Go to Swap",
        icon: "warning" as const,
      };
      const action = makeSetEarnActionDialogAction(payload);
      const state = reducer(INITIAL_STATE, action);

      expect(state.actionDialog).toEqual(payload);
    });

    it("should set actionDialog to undefined when payload is undefined", () => {
      const stateWithDialog = reducer(
        INITIAL_STATE,
        makeSetEarnActionDialogAction({
          title: "T",
          description: "D",
          ctaLabel: "C",
        }),
      );
      const action = makeSetEarnActionDialogAction(undefined);
      const state = reducer(stateWithDialog, action);

      expect(state.actionDialog).toBeUndefined();
    });

    it("should preserve other earn state when updating actionDialog", () => {
      const baseState = {
        ...INITIAL_STATE,
        infoModal: { messageTitle: "Modal" },
      };
      const payload = {
        title: "Title",
        description: "Desc",
        ctaLabel: "CTA",
      };
      const action = makeSetEarnActionDialogAction(payload);
      const state = reducer(baseState, action);

      expect(state.actionDialog).toEqual(payload);
      expect(state.infoModal).toEqual({ messageTitle: "Modal" });
    });
  });

describe("earnMenuBottomSheetSelector", () => {
  it("should return menuBottomSheet from earn state", () => {
    const menuBottomSheet = [
      {
        icon: "Plus",
        label: "L",
        metadata: { button: "b", live_app: "earn", flow: "f" },
      },
    ];
    const state: State = {
      ...({} as State),
      earn: {
        ...INITIAL_STATE,
        menuBottomSheet,
      },
    };

    expect(earnMenuBottomSheetSelector(state)).toEqual(menuBottomSheet);
  });

  it("should return undefined when menuBottomSheet is initial", () => {
    const state: State = {
      ...({} as State),
      earn: INITIAL_STATE,
    };

    expect(earnMenuBottomSheetSelector(state)).toBeUndefined();
  });
});

describe("earnActionDialogSelector", () => {
  it("should return actionDialog from earn state", () => {
    const actionDialog = {
      title: "Confirm",
      description: "Please confirm",
      ctaLabel: "OK",
      icon: "info" as const,
    };
    const state: State = {
      ...({} as State),
      earn: {
        ...INITIAL_STATE,
        actionDialog,
      },
    };

    expect(earnActionDialogSelector(state)).toEqual(actionDialog);
  });

  it("should return undefined when actionDialog is initial", () => {
    const state: State = {
      ...({} as State),
      earn: INITIAL_STATE,
    };

    expect(earnActionDialogSelector(state)).toBeUndefined();
  });
});
