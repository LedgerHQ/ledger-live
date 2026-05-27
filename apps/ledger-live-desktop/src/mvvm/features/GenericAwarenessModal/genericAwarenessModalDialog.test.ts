import { setDismissedContentCards } from "~/renderer/actions/settings";
import { closeDialog, openDialog } from "~/renderer/reducers/dialogs";
import {
  selectGenericAwarenessModalCampaignId,
  setGenericAwarenessModalCampaignId,
  setGenericAwarenessModalContentCards,
} from "~/renderer/reducers/genericAwarenessModalSlice";
import type { State } from "~/renderer/reducers";
import type { AppDispatch } from "~/state-manager/configureStore";
import { CAROUSEL_CAMPAIGN_ID, carouselCampaignCard } from "./__tests__/fixtures";
import {
  createGenericAwarenessModalTestState,
  initialGenericAwarenessModalState,
} from "./__tests__/testHelpers";
import {
  closeGenericAwarenessModalDialog,
  openGenericAwarenessModalDialog,
  selectIsGenericAwarenessModalOpen,
} from "./genericAwarenessModalDialog";

const collectThunkDispatches = (
  runThunk: (dispatch: AppDispatch, getState: () => State) => void,
  getState: () => State = () => createGenericAwarenessModalTestState(),
) => {
  const dispatched: unknown[] = [];
  const dispatch = ((action: unknown) => {
    dispatched.push(action);
  }) as AppDispatch;
  runThunk(dispatch, getState);
  return dispatched;
};

describe("genericAwarenessModalDialog", () => {
  it("should store campaign id without opening dialog when no matching content card exists", () => {
    const actions = collectThunkDispatches((dispatch, getState) => {
      openGenericAwarenessModalDialog({ campaignId: "campaign-a" })(dispatch, getState);
    });

    expect(actions).toEqual([setGenericAwarenessModalCampaignId("campaign-a")]);
  });

  it("should store campaign id and open dialog when a matching content card exists", () => {
    const actions = collectThunkDispatches(dispatch => {
      openGenericAwarenessModalDialog({ campaignId: CAROUSEL_CAMPAIGN_ID })(dispatch, () =>
        createGenericAwarenessModalTestState({
          genericAwarenessModal: {
            contentCards: [carouselCampaignCard],
            campaignId: undefined,
          },
        }),
      );
    });

    expect(actions[0]).toEqual(setGenericAwarenessModalCampaignId(CAROUSEL_CAMPAIGN_ID));
    expect(actions[1]).toEqual(openDialog("GENERIC_AWARENESS_MODAL"));
  });

  it("should clear campaign id without opening dialog when no content cards are in the store", () => {
    const actions = collectThunkDispatches((dispatch, getState) => {
      openGenericAwarenessModalDialog()(dispatch, getState);
    });

    expect(actions).toEqual([setGenericAwarenessModalCampaignId(undefined)]);
  });

  it("should close dialog and clear campaign id when close thunk runs without a content card", () => {
    const actions = collectThunkDispatches(dispatch => {
      closeGenericAwarenessModalDialog()(dispatch, createGenericAwarenessModalTestState);
    });

    expect(actions[0]).toEqual(closeDialog("GENERIC_AWARENESS_MODAL"));
    expect(actions[1]).toEqual(setGenericAwarenessModalCampaignId(undefined));
  });

  it("should dismiss content card id and filter the slice when close thunk runs with a content card", () => {
    const actions = collectThunkDispatches(dispatch => {
      closeGenericAwarenessModalDialog()(dispatch, () =>
        createGenericAwarenessModalTestState({
          genericAwarenessModal: {
            contentCards: [carouselCampaignCard],
            campaignId: CAROUSEL_CAMPAIGN_ID,
          },
          dialogs: { GENERIC_AWARENESS_MODAL: true },
        }),
      );
    });

    const dismissAction = actions[0] as ReturnType<typeof setDismissedContentCards>;
    expect(dismissAction.type).toBe("SET_DISMISSED_CONTENT_CARDS");
    expect(dismissAction.payload.id).toBe(CAROUSEL_CAMPAIGN_ID);
    expect(typeof dismissAction.payload.timestamp).toBe("number");
    expect(actions[1]).toEqual(setGenericAwarenessModalContentCards([]));
    expect(actions[2]).toEqual(closeDialog("GENERIC_AWARENESS_MODAL"));
    expect(actions[3]).toEqual(setGenericAwarenessModalCampaignId(undefined));
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

  it("should read campaign id from genericAwarenessModal slice state", () => {
    expect(
      selectGenericAwarenessModalCampaignId(
        createGenericAwarenessModalTestState({
          genericAwarenessModal: {
            ...initialGenericAwarenessModalState,
            campaignId: "welcome-v2",
          },
        }),
      ),
    ).toBe("welcome-v2");
  });
});
