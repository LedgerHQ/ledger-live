import { act } from "tests/testSetup";
import { saveSettings, setDismissedContentCards } from "~/renderer/actions/settings";
import { setGenericAwarenessModalContentCards } from "~/renderer/reducers/genericAwarenessModalSlice";
import { openDialog } from "~/renderer/reducers/dialogs";
import {
  APP_START_CAMPAIGN_ID,
  carouselCampaignCard,
  featureIntroCampaignCard,
  genericAwarenessModalTestContentCards,
} from "../../__tests__/fixtures";
import { initialGenericAwarenessModalState } from "../../__tests__/testHelpers";
import useGenericAwarenessModalAppStart from "../useGenericAwarenessModalAppStart";
import { renderHookWithStore } from "../testHelpers/renderHookWithStore";

const nonAppStartContentCards = [featureIntroCampaignCard, carouselCampaignCard];

const mockUseFeature = jest.fn((_flag: string) => ({ enabled: true }));

jest.mock("@features/platform-feature-flags", () => ({
  useFeature: (flag: string) => mockUseFeature(flag),
}));

const seedAppStartReadyState = (
  store: ReturnType<typeof renderHookWithStore>["store"],
  options?: { hasCompletedOnboarding?: boolean },
) => {
  if (options?.hasCompletedOnboarding !== false) {
    store.dispatch(saveSettings({ hasCompletedOnboarding: true }));
  }
  store.dispatch(setGenericAwarenessModalContentCards(genericAwarenessModalTestContentCards));
};

describe("useGenericAwarenessModalAppStart", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFeature.mockReturnValue({ enabled: true });
  });

  it("should not open the modal when feature flag is disabled", () => {
    mockUseFeature.mockReturnValue({ enabled: false });
    const { store } = renderHookWithStore(() => useGenericAwarenessModalAppStart());

    act(() => {
      seedAppStartReadyState(store);
    });

    expect(store.getState().dialogs.GENERIC_AWARENESS_MODAL).toBeUndefined();
  });

  it("should not open the modal when onboarding is incomplete", () => {
    const { store } = renderHookWithStore(() => useGenericAwarenessModalAppStart());

    act(() => {
      seedAppStartReadyState(store, { hasCompletedOnboarding: false });
    });

    expect(store.getState().dialogs.GENERIC_AWARENESS_MODAL).toBeUndefined();
  });

  it("should not open the modal when APP_START campaign was dismissed", () => {
    const { store } = renderHookWithStore(() => useGenericAwarenessModalAppStart());

    act(() => {
      store.dispatch(saveSettings({ hasCompletedOnboarding: true }));
      store.dispatch(
        setDismissedContentCards({ id: APP_START_CAMPAIGN_ID, timestamp: Date.now() }),
      );
      store.dispatch(setGenericAwarenessModalContentCards(genericAwarenessModalTestContentCards));
    });

    expect(store.getState().dialogs.GENERIC_AWARENESS_MODAL).toBeUndefined();
  });

  it("should not open the modal when no APP_START content card exists", () => {
    const { store } = renderHookWithStore(() => useGenericAwarenessModalAppStart());

    act(() => {
      store.dispatch(saveSettings({ hasCompletedOnboarding: true }));
      store.dispatch(setGenericAwarenessModalContentCards(nonAppStartContentCards));
    });

    expect(store.getState().dialogs.GENERIC_AWARENESS_MODAL).toBeUndefined();
  });

  it("should open the modal when an APP_START content card is available", () => {
    const { store } = renderHookWithStore(() => useGenericAwarenessModalAppStart());

    act(() => {
      seedAppStartReadyState(store);
    });

    expect(store.getState().dialogs.GENERIC_AWARENESS_MODAL).toBe(true);
    expect(store.getState().genericAwarenessModal).toEqual({
      ...initialGenericAwarenessModalState,
      contentCards: genericAwarenessModalTestContentCards,
    });
  });

  it("should open only once per session when content cards update again", () => {
    const { store } = renderHookWithStore(() => useGenericAwarenessModalAppStart());

    act(() => {
      seedAppStartReadyState(store);
    });

    act(() => {
      store.dispatch(setGenericAwarenessModalContentCards([]));
      store.dispatch(setGenericAwarenessModalContentCards(genericAwarenessModalTestContentCards));
    });

    expect(store.getState().dialogs.GENERIC_AWARENESS_MODAL).toBe(true);
  });

  it("should not open when the modal is already open", () => {
    const { store } = renderHookWithStore(() => useGenericAwarenessModalAppStart());

    act(() => {
      store.dispatch(saveSettings({ hasCompletedOnboarding: true }));
      store.dispatch(openDialog("GENERIC_AWARENESS_MODAL"));
      store.dispatch(setGenericAwarenessModalContentCards(genericAwarenessModalTestContentCards));
    });

    expect(store.getState().dialogs.GENERIC_AWARENESS_MODAL).toBe(true);
    expect(store.getState().genericAwarenessModal.campaignId).toBeUndefined();
    expect(store.getState().genericAwarenessModal.contentCards).toEqual(
      genericAwarenessModalTestContentCards,
    );
  });
});
