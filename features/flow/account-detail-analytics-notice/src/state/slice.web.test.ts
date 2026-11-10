import { configureStore } from "@reduxjs/toolkit";
import { shouldShowAccountAnalyticsIntroduction } from "../logic/shouldShowAccountAnalyticsIntroduction";
import {
  accountAnalyticsIntroductionSlice,
  dismissAccountAnalyticsIntroduction,
  resetAccountAnalyticsIntroduction,
  restoreAccountAnalyticsIntroduction,
} from "./slice";
import {
  accountAnalyticsIntroductionPersistedSelector,
  selectAccountAnalyticsIntroductionDismissed,
} from "./selectors";

const createStore = () =>
  configureStore({
    reducer: { accountAnalyticsIntroduction: accountAnalyticsIntroductionSlice.reducer },
  });

describe("accountAnalyticsIntroduction", () => {
  it("should remain unconsumed when checking an eligible account", () => {
    const store = createStore();

    expect(
      shouldShowAccountAnalyticsIntroduction({
        isEnabled: true,
        hasConfirmedHistory: true,
        hasDismissed: selectAccountAnalyticsIntroductionDismissed(store.getState()),
      }),
    ).toBe(true);
    expect(accountAnalyticsIntroductionPersistedSelector(store.getState())).toEqual({
      hasDismissed: false,
    });
  });

  it("should dismiss the introduction for every account without storing account IDs", () => {
    const store = createStore();
    store.dispatch(dismissAccountAnalyticsIntroduction());

    for (const hasConfirmedHistory of [true, false]) {
      expect(
        shouldShowAccountAnalyticsIntroduction({
          isEnabled: true,
          hasConfirmedHistory,
          hasDismissed: selectAccountAnalyticsIntroductionDismissed(store.getState()),
        }),
      ).toBe(false);
    }
    expect(accountAnalyticsIntroductionPersistedSelector(store.getState())).toEqual({
      hasDismissed: true,
    });
  });

  it("should keep the same state when dismissing an already dismissed introduction", () => {
    const store = createStore();
    store.dispatch(dismissAccountAnalyticsIntroduction());
    const dismissedState = store.getState();
    store.dispatch(dismissAccountAnalyticsIntroduction());

    expect(store.getState()).toBe(dismissedState);
  });

  it("should show the introduction again after a reset", () => {
    const store = createStore();
    store.dispatch(dismissAccountAnalyticsIntroduction());
    store.dispatch(resetAccountAnalyticsIntroduction());

    expect(
      shouldShowAccountAnalyticsIntroduction({
        isEnabled: true,
        hasConfirmedHistory: true,
        hasDismissed: selectAccountAnalyticsIntroductionDismissed(store.getState()),
      }),
    ).toBe(true);
  });

  it("should keep the same state when resetting an introduction that was never dismissed", () => {
    const store = createStore();
    const initialState = store.getState();
    store.dispatch(resetAccountAnalyticsIntroduction());

    expect(store.getState()).toBe(initialState);
  });

  it("should preserve dismissal after a persistence round trip into a new store", () => {
    const firstStore = createStore();
    firstStore.dispatch(dismissAccountAnalyticsIntroduction());
    const saved: unknown = JSON.parse(
      JSON.stringify(accountAnalyticsIntroductionPersistedSelector(firstStore.getState())),
    );
    const restoredStore = createStore();
    restoredStore.dispatch(restoreAccountAnalyticsIntroduction(saved));

    expect(selectAccountAnalyticsIntroductionDismissed(restoredStore.getState())).toBe(true);
    expect(selectAccountAnalyticsIntroductionDismissed(createStore().getState())).toBe(false);
  });

  it.each([true, false])("should restore a persisted boolean %s", hasDismissed => {
    const store = createStore();
    store.dispatch(restoreAccountAnalyticsIntroduction({ hasDismissed }));

    expect(selectAccountAnalyticsIntroductionDismissed(store.getState())).toBe(hasDismissed);
  });

  it.each(
    [undefined, null, [], true, "true", {}, { hasDismissed: "false" }, { hasDismissed: 1 }].map(
      payload => ({ payload }),
    ),
  )("should retain the session dismissal when restoring invalid data $payload", ({ payload }) => {
    const store = createStore();
    store.dispatch(dismissAccountAnalyticsIntroduction());
    store.dispatch(restoreAccountAnalyticsIntroduction(payload));

    expect(selectAccountAnalyticsIntroductionDismissed(store.getState())).toBe(true);
  });
});
