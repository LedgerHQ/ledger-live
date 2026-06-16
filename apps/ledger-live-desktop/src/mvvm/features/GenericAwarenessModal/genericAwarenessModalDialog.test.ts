import { setDismissedContentCards } from "~/renderer/actions/settings";
import { closeDialog, openDialog } from "~/renderer/reducers/dialogs";
import {
  selectGenericAwarenessModalCampaignId,
  setGenericAwarenessModalCampaignId,
  setGenericAwarenessModalContentCards,
} from "~/renderer/reducers/genericAwarenessModalSlice";
import type { State } from "~/renderer/reducers";
import type { AppDispatch } from "~/state-manager/configureStore";
import {
  APP_START_CAMPAIGN_ID,
  appStartFeatureIntroCard,
  CAROUSEL_CAMPAIGN_ID,
  carouselCampaignCard,
} from "./testUtils/fixtures";
import {
  createGenericAwarenessModalTestState,
  initialGenericAwarenessModalState,
} from "./testUtils/modalTestUtils";
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

const isDismissedContentCardsAction = (
  action: unknown,
): action is ReturnType<typeof setDismissedContentCards> =>
  typeof action === "object" &&
  action !== null &&
  "type" in action &&
  action.type === "SET_DISMISSED_CONTENT_CARDS";

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

  it("should not dismiss APP_START content card when close thunk runs without dismissAppStart", () => {
    const actions = collectThunkDispatches(dispatch => {
      closeGenericAwarenessModalDialog()(dispatch, () =>
        createGenericAwarenessModalTestState({
          genericAwarenessModal: {
            contentCards: [appStartFeatureIntroCard, carouselCampaignCard],
            campaignId: undefined,
          },
          dialogs: { GENERIC_AWARENESS_MODAL: true },
        }),
      );
    });

    expect(actions).toEqual([
      closeDialog("GENERIC_AWARENESS_MODAL"),
      setGenericAwarenessModalCampaignId(undefined),
    ]);
    expect(actions.some(isDismissedContentCardsAction)).toBe(false);
  });

  it("should dismiss APP_START content card and filter the slice when close thunk runs with dismissAppStart", () => {
    const actions = collectThunkDispatches(dispatch => {
      closeGenericAwarenessModalDialog({ dismissAppStart: true })(dispatch, () =>
        createGenericAwarenessModalTestState({
          genericAwarenessModal: {
            contentCards: [appStartFeatureIntroCard, carouselCampaignCard],
            campaignId: undefined,
          },
          dialogs: { GENERIC_AWARENESS_MODAL: true },
        }),
      );
    });

    const dismissAction = actions.find(isDismissedContentCardsAction);
    expect(dismissAction?.payload.id).toBe(APP_START_CAMPAIGN_ID);
    expect(typeof dismissAction?.payload.timestamp).toBe("number");
    expect(actions).toContainEqual(setGenericAwarenessModalContentCards([carouselCampaignCard]));
    expect(actions).toContainEqual(closeDialog("GENERIC_AWARENESS_MODAL"));
    expect(actions).toContainEqual(setGenericAwarenessModalCampaignId(undefined));
  });

  it("should not dismiss non-APP_START campaigns when close thunk runs with dismissAppStart", () => {
    const actions = collectThunkDispatches(dispatch => {
      closeGenericAwarenessModalDialog({ dismissAppStart: true })(dispatch, () =>
        createGenericAwarenessModalTestState({
          genericAwarenessModal: {
            contentCards: [carouselCampaignCard],
            campaignId: CAROUSEL_CAMPAIGN_ID,
          },
          dialogs: { GENERIC_AWARENESS_MODAL: true },
        }),
      );
    });

    expect(actions).toEqual([
      closeDialog("GENERIC_AWARENESS_MODAL"),
      setGenericAwarenessModalCampaignId(undefined),
    ]);
    expect(actions.some(isDismissedContentCardsAction)).toBe(false);
    expect(
      actions.some(
        action =>
          typeof action === "object" &&
          action !== null &&
          "type" in action &&
          action.type === setGenericAwarenessModalContentCards.type,
      ),
    ).toBe(false);
  });

  it("should dismiss APP_START content cards regardless of id casing when close thunk runs with dismissAppStart", () => {
    const lowercaseAppStartCampaignId = "app_start_lowercase";
    const lowercaseAppStartCard = {
      ...appStartFeatureIntroCard,
      id: lowercaseAppStartCampaignId,
    };

    const actions = collectThunkDispatches(dispatch => {
      closeGenericAwarenessModalDialog({ dismissAppStart: true })(dispatch, () =>
        createGenericAwarenessModalTestState({
          genericAwarenessModal: {
            contentCards: [lowercaseAppStartCard, carouselCampaignCard],
            campaignId: lowercaseAppStartCampaignId,
          },
          dialogs: { GENERIC_AWARENESS_MODAL: true },
        }),
      );
    });

    const dismissAction = actions.find(isDismissedContentCardsAction);
    expect(dismissAction?.payload.id).toBe(lowercaseAppStartCampaignId);
    expect(actions).toContainEqual(setGenericAwarenessModalContentCards([carouselCampaignCard]));
    expect(actions).toContainEqual(closeDialog("GENERIC_AWARENESS_MODAL"));
    expect(actions).toContainEqual(setGenericAwarenessModalCampaignId(undefined));
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
