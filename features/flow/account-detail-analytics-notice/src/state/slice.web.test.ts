import { configureStore } from "@reduxjs/toolkit";
import { shouldShowAccountAnalyticsIntroduction } from "../logic/shouldShowAccountAnalyticsIntroduction";
import {
  accountAnalyticsIntroductionSlice,
  dismissAccountAnalyticsIntroduction,
  overrideAccountAnalyticsIntroductionEligibility,
  recordAccountAnalyticsIntroductionEligibility,
  resetAccountAnalyticsIntroduction,
  restoreAccountAnalyticsIntroduction,
} from "./slice";
import {
  accountAnalyticsIntroductionPersistedSelector,
  selectAccountAnalyticsIntroductionDismissed,
  selectAccountAnalyticsIntroductionEligible,
} from "./selectors";

const createStore = () =>
  configureStore({
    reducer: { accountAnalyticsIntroduction: accountAnalyticsIntroductionSlice.reducer },
  });

type Store = ReturnType<typeof createStore>;

const isShownFor = (store: Store, hasConfirmedHistory: boolean) =>
  shouldShowAccountAnalyticsIntroduction({
    isEnabled: true,
    isEligible: selectAccountAnalyticsIntroductionEligible(store.getState()),
    hasConfirmedHistory,
    hasDismissed: selectAccountAnalyticsIntroductionDismissed(store.getState()),
  });

const createEligibleStore = () => {
  const store = createStore();
  store.dispatch(recordAccountAnalyticsIntroductionEligibility(true));
  return store;
};

describe("accountAnalyticsIntroduction", () => {
  it("should start without an eligibility snapshot and hide the introduction", () => {
    const store = createStore();

    expect(isShownFor(store, true)).toBe(false);
    expect(accountAnalyticsIntroductionPersistedSelector(store.getState())).toEqual({
      hasDismissed: false,
      isEligible: null,
    });
  });

  it("should remain unconsumed when checking an eligible account", () => {
    const store = createEligibleStore();

    expect(isShownFor(store, true)).toBe(true);
    expect(accountAnalyticsIntroductionPersistedSelector(store.getState())).toEqual({
      hasDismissed: false,
      isEligible: true,
    });
  });

  it("should dismiss the introduction for every account without storing account IDs", () => {
    const store = createEligibleStore();
    store.dispatch(dismissAccountAnalyticsIntroduction());

    for (const hasConfirmedHistory of [true, false]) {
      expect(isShownFor(store, hasConfirmedHistory)).toBe(false);
    }
    expect(accountAnalyticsIntroductionPersistedSelector(store.getState())).toEqual({
      hasDismissed: true,
      isEligible: true,
    });
  });

  it("should keep the same state when dismissing an already dismissed introduction", () => {
    const store = createStore();
    store.dispatch(dismissAccountAnalyticsIntroduction());
    const dismissedState = store.getState();
    store.dispatch(dismissAccountAnalyticsIntroduction());

    expect(store.getState()).toBe(dismissedState);
  });

  it("should show the introduction again after a reset and keep the eligibility snapshot", () => {
    const store = createEligibleStore();
    store.dispatch(dismissAccountAnalyticsIntroduction());
    store.dispatch(resetAccountAnalyticsIntroduction());

    expect(isShownFor(store, true)).toBe(true);
    expect(selectAccountAnalyticsIntroductionEligible(store.getState())).toBe(true);
  });

  it("should keep the same state when resetting an introduction that was never dismissed", () => {
    const store = createStore();
    const initialState = store.getState();
    store.dispatch(resetAccountAnalyticsIntroduction());

    expect(store.getState()).toBe(initialState);
  });

  it.each([true, false])("should record the eligibility snapshot %s once", isEligible => {
    const store = createStore();
    store.dispatch(recordAccountAnalyticsIntroductionEligibility(isEligible));
    const recordedState = store.getState();
    store.dispatch(recordAccountAnalyticsIntroductionEligibility(!isEligible));

    expect(store.getState()).toBe(recordedState);
    expect(selectAccountAnalyticsIntroductionEligible(store.getState())).toBe(isEligible);
  });

  it.each([false, null])(
    "should let debug tools replace a recorded eligibility snapshot with %s",
    isEligible => {
      const store = createEligibleStore();
      store.dispatch(dismissAccountAnalyticsIntroduction());

      store.dispatch(overrideAccountAnalyticsIntroductionEligibility(isEligible));

      expect(accountAnalyticsIntroductionPersistedSelector(store.getState())).toEqual({
        hasDismissed: true,
        isEligible,
      });
    },
  );

  it("should record the eligibility again after debug tools clear it", () => {
    const store = createEligibleStore();
    store.dispatch(overrideAccountAnalyticsIntroductionEligibility(null));

    store.dispatch(recordAccountAnalyticsIntroductionEligibility(false));

    expect(selectAccountAnalyticsIntroductionEligible(store.getState())).toBe(false);
  });

  it("should keep a restored eligibility snapshot instead of recording a new one", () => {
    const store = createStore();
    store.dispatch(restoreAccountAnalyticsIntroduction({ hasDismissed: false, isEligible: false }));
    store.dispatch(recordAccountAnalyticsIntroductionEligibility(true));

    expect(selectAccountAnalyticsIntroductionEligible(store.getState())).toBe(false);
  });

  it("should preserve dismissal and eligibility after a persistence round trip into a new store", () => {
    const firstStore = createEligibleStore();
    firstStore.dispatch(dismissAccountAnalyticsIntroduction());
    const saved: unknown = JSON.parse(
      JSON.stringify(accountAnalyticsIntroductionPersistedSelector(firstStore.getState())),
    );
    const restoredStore = createStore();
    restoredStore.dispatch(restoreAccountAnalyticsIntroduction(saved));

    expect(selectAccountAnalyticsIntroductionDismissed(restoredStore.getState())).toBe(true);
    expect(selectAccountAnalyticsIntroductionEligible(restoredStore.getState())).toBe(true);
    expect(selectAccountAnalyticsIntroductionDismissed(createStore().getState())).toBe(false);
  });

  it.each([true, false])("should restore a persisted boolean %s", value => {
    const store = createStore();
    store.dispatch(restoreAccountAnalyticsIntroduction({ hasDismissed: value, isEligible: value }));

    expect(selectAccountAnalyticsIntroductionDismissed(store.getState())).toBe(value);
    expect(selectAccountAnalyticsIntroductionEligible(store.getState())).toBe(value);
  });

  it("should restore a dismissal persisted before the eligibility snapshot existed", () => {
    const store = createStore();
    store.dispatch(restoreAccountAnalyticsIntroduction({ hasDismissed: true }));

    expect(accountAnalyticsIntroductionPersistedSelector(store.getState())).toEqual({
      hasDismissed: true,
      isEligible: null,
    });
  });

  it.each(
    [
      undefined,
      null,
      [],
      true,
      "true",
      {},
      { hasDismissed: "false", isEligible: "true" },
      { hasDismissed: 1, isEligible: 0 },
    ].map(payload => ({ payload })),
  )("should retain the session state when restoring invalid data $payload", ({ payload }) => {
    const store = createEligibleStore();
    store.dispatch(dismissAccountAnalyticsIntroduction());
    store.dispatch(restoreAccountAnalyticsIntroduction(payload));

    expect(selectAccountAnalyticsIntroductionDismissed(store.getState())).toBe(true);
    expect(selectAccountAnalyticsIntroductionEligible(store.getState())).toBe(true);
  });
});
