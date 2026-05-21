import { act } from "@testing-library/react";
import { saveSettings } from "~/renderer/actions/settings";
import { setGenericAwarenessModalContentCards } from "~/renderer/reducers/genericAwarenessModalSlice";
import { openDialog } from "~/renderer/reducers/dialogs";
import { genericAwarenessModalTestContentCards } from "../../__tests__/fixtures";
import useGenericAwarenessModalAppStart from "../useGenericAwarenessModalAppStart";
import { renderHookWithStore } from "./utils/renderHookWithStore";

const mockUseFeature = jest.fn((_flag: string) => ({ enabled: true }));

jest.mock("@ledgerhq/live-common/featureFlags/index", () => ({
  useFeature: (flag: string) => mockUseFeature(flag),
}));

describe("useGenericAwarenessModalAppStart", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFeature.mockReturnValue({ enabled: true });
  });

  it("should not open the modal when feature flag is disabled", () => {
    mockUseFeature.mockReturnValue({ enabled: false });
    const { store } = renderHookWithStore(() => useGenericAwarenessModalAppStart());

    act(() => {
      store.dispatch(setGenericAwarenessModalContentCards(genericAwarenessModalTestContentCards));
    });

    expect(store.getState().dialogs.GENERIC_AWARENESS_MODAL).toBeUndefined();
  });

  it("should not open the modal when no APP_START content card exists", () => {
    const { store } = renderHookWithStore(() => useGenericAwarenessModalAppStart());

    act(() => {
      store.dispatch(
        setGenericAwarenessModalContentCards(
          genericAwarenessModalTestContentCards.filter(card => !card.id.startsWith("APP_START")),
        ),
      );
    });

    expect(store.getState().dialogs.GENERIC_AWARENESS_MODAL).toBeUndefined();
  });

  it("should open the modal when an APP_START content card is available", () => {
    const { store } = renderHookWithStore(() => useGenericAwarenessModalAppStart());

    act(() => {
      store.dispatch(saveSettings({ hasCompletedOnboarding: true }));
      store.dispatch(setGenericAwarenessModalContentCards(genericAwarenessModalTestContentCards));
    });

    expect(store.getState().dialogs.GENERIC_AWARENESS_MODAL).toBe(true);
    expect(store.getState().genericAwarenessModalDialog.campaignId).toBeUndefined();
  });

  it("should open only once per session when content cards update again", () => {
    const { store } = renderHookWithStore(() => useGenericAwarenessModalAppStart());

    act(() => {
      store.dispatch(saveSettings({ hasCompletedOnboarding: true }));
      store.dispatch(setGenericAwarenessModalContentCards(genericAwarenessModalTestContentCards));
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
    expect(store.getState().genericAwarenessModalDialog.campaignId).toBeUndefined();
  });
});
