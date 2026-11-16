import { configureStore } from "@reduxjs/toolkit";
import {
  accountAnalyticsIntroductionSlice,
  dismissAccountAnalyticsIntroduction,
} from "@features/flow-account-detail-analytics-notice/state";
import { getKey } from "~/renderer/storage";
import { restoreAccountAnalyticsIntroductionFromStorage } from "../restoreAccountAnalyticsIntroduction";

jest.mock("~/renderer/storage", () => ({ getKey: jest.fn() }));

const createStore = () =>
  configureStore({
    reducer: { accountAnalyticsIntroduction: accountAnalyticsIntroductionSlice.reducer },
  });

describe("Analytics introduction startup restoration", () => {
  it("should restore a previous dismissal before rendering", async () => {
    jest.mocked(getKey).mockResolvedValueOnce({ hasDismissed: true });
    const store = createStore();

    await restoreAccountAnalyticsIntroductionFromStorage(store.dispatch, true);

    expect(getKey).toHaveBeenCalledWith("app", "accountAnalyticsIntroduction");
    expect(store.getState().accountAnalyticsIntroduction.hasDismissed).toBe(true);
  });

  it.each([true, false])(
    "should record the eligibility snapshot %s when nothing was persisted",
    async hasOnboardedWithDevice => {
      jest.mocked(getKey).mockResolvedValueOnce(undefined);
      const store = createStore();

      await restoreAccountAnalyticsIntroductionFromStorage(store.dispatch, hasOnboardedWithDevice);

      expect(store.getState().accountAnalyticsIntroduction).toEqual({
        hasDismissed: false,
        isEligible: hasOnboardedWithDevice,
      });
    },
  );

  it("should keep a persisted eligibility snapshot instead of recording a new one", async () => {
    jest.mocked(getKey).mockResolvedValueOnce({ hasDismissed: false, isEligible: false });
    const store = createStore();

    await restoreAccountAnalyticsIntroductionFromStorage(store.dispatch, true);

    expect(store.getState().accountAnalyticsIntroduction.isEligible).toBe(false);
  });

  it("should preserve the current state, record no snapshot and complete startup when storage cannot be read", async () => {
    jest.mocked(getKey).mockRejectedValueOnce(new Error("Storage unavailable"));
    const store = createStore();
    store.dispatch(dismissAccountAnalyticsIntroduction());

    await expect(
      restoreAccountAnalyticsIntroductionFromStorage(store.dispatch, true),
    ).resolves.toBeUndefined();

    expect(store.getState().accountAnalyticsIntroduction).toEqual({
      hasDismissed: true,
      isEligible: null,
    });
  });
});
