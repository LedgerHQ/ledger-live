import { configureStore } from "@reduxjs/toolkit";
import {
  accountAnalyticsIntroductionSlice,
  dismissAccountAnalyticsIntroduction,
} from "@features/flow-account-detail/state";
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

    await restoreAccountAnalyticsIntroductionFromStorage(store.dispatch);

    expect(getKey).toHaveBeenCalledWith("app", "accountAnalyticsIntroduction");
    expect(store.getState().accountAnalyticsIntroduction.hasDismissed).toBe(true);
  });

  it("should leave a new installation eligible when no persisted dismissal exists", async () => {
    jest.mocked(getKey).mockResolvedValueOnce(undefined);
    const store = createStore();

    await restoreAccountAnalyticsIntroductionFromStorage(store.dispatch);

    expect(store.getState().accountAnalyticsIntroduction.hasDismissed).toBe(false);
  });

  it("should preserve the current state and complete startup when storage cannot be read", async () => {
    jest.mocked(getKey).mockRejectedValueOnce(new Error("Storage unavailable"));
    const store = createStore();
    store.dispatch(dismissAccountAnalyticsIntroduction());

    await expect(
      restoreAccountAnalyticsIntroductionFromStorage(store.dispatch),
    ).resolves.toBeUndefined();

    expect(store.getState().accountAnalyticsIntroduction.hasDismissed).toBe(true);
  });
});
