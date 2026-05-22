import { closeDialog, openDialog } from "~/renderer/reducers/dialogs";
import { setGenericAwarenessModalCampaignId } from "~/renderer/reducers/genericAwarenessModalDialogSlice";
import type { AppDispatch } from "~/state-manager/configureStore";
import {
  closeGenericAwarenessModalDialog,
  openGenericAwarenessModalDialog,
  resolveGenericAwarenessModalContentVariant,
  selectGenericAwarenessModalCampaignId,
  selectIsGenericAwarenessModalOpen,
} from "./genericAwarenessModalDialog";

function collectThunkDispatches(thunkFn: (dispatch: AppDispatch) => void) {
  const dispatched: unknown[] = [];
  const fakeDispatch = ((action: unknown) => {
    dispatched.push(action);
  }) as AppDispatch;
  thunkFn(fakeDispatch);
  return dispatched;
}

describe("resolveGenericAwarenessModalContentVariant", () => {
  it("should return carousel for even numeric campaign ids", () => {
    expect(resolveGenericAwarenessModalContentVariant("0")).toBe("carousel");
    expect(resolveGenericAwarenessModalContentVariant("2")).toBe("carousel");
  });

  it("should return feature intro for odd numeric campaign ids", () => {
    expect(resolveGenericAwarenessModalContentVariant("1")).toBe("featureIntro");
    expect(resolveGenericAwarenessModalContentVariant("3")).toBe("featureIntro");
  });

  it("should return feature intro when campaign id is missing or not numeric", () => {
    expect(resolveGenericAwarenessModalContentVariant(undefined)).toBe("featureIntro");
    expect(resolveGenericAwarenessModalContentVariant("welcome")).toBe("featureIntro");
  });
});

describe("genericAwarenessModal", () => {
  it("open thunk stores campaign id and opens dialog", () => {
    const actions = collectThunkDispatches(openGenericAwarenessModalDialog({ campaignId: "campaign-a" }));

    expect(actions[0]).toEqual(setGenericAwarenessModalCampaignId("campaign-a"));
    expect(actions[1]).toEqual(openDialog("GENERIC_AWARENESS_MODAL"));
  });

  it("open thunk without campaign id clears stored campaign id", () => {
    const actions = collectThunkDispatches(openGenericAwarenessModalDialog());

    expect(actions[0]).toEqual(setGenericAwarenessModalCampaignId(undefined));
    expect(actions[1]).toEqual(openDialog("GENERIC_AWARENESS_MODAL"));
  });

  it("close thunk closes dialog and clears campaign id", () => {
    const actions = collectThunkDispatches(closeGenericAwarenessModalDialog());

    expect(actions[0]).toEqual(closeDialog("GENERIC_AWARENESS_MODAL"));
    expect(actions[1]).toEqual(setGenericAwarenessModalCampaignId(undefined));
  });

  it("should return false from selector when dialog is absent", () => {
    expect(selectIsGenericAwarenessModalOpen({ dialogs: {} })).toBe(false);
  });

  it("should return true from selector when GENERIC_AWARENESS_MODAL is open", () => {
    expect(
      selectIsGenericAwarenessModalOpen({
        dialogs: { GENERIC_AWARENESS_MODAL: true },
      }),
    ).toBe(true);
  });

  it("should return false from selector when GENERIC_AWARENESS_MODAL is explicitly closed", () => {
    expect(
      selectIsGenericAwarenessModalOpen({
        dialogs: { GENERIC_AWARENESS_MODAL: false },
      }),
    ).toBe(false);
  });

  it("selectGenericAwarenessModalCampaignId reads slice state", () => {
    expect(
      selectGenericAwarenessModalCampaignId({
        genericAwarenessModalDialog: { campaignId: "welcome-v2" },
      }),
    ).toBe("welcome-v2");
  });
});
