import { configureStore } from "@reduxjs/toolkit";
import { accountAnalyticsIntroductionSlice } from "@features/flow-account-detail-analytics-notice/state";
import { getAccountAnalyticsIntroductionState, saveAccountAnalyticsIntroductionState } from "~/db";
import {
  restoreAccountAnalyticsIntroductionFromStorage,
  saveAccountAnalyticsIntroductionSafely,
} from "./analyticsIntroductionStorage";

jest.mock("~/db", () => ({
  getAccountAnalyticsIntroductionState: jest.fn(),
  saveAccountAnalyticsIntroductionState: jest.fn(),
}));

const mockGet = jest.mocked(getAccountAnalyticsIntroductionState);
const mockSave = jest.mocked(saveAccountAnalyticsIntroductionState);

const createStore = () =>
  configureStore({
    reducer: { accountAnalyticsIntroduction: accountAnalyticsIntroductionSlice.reducer },
  });

describe("analyticsIntroductionStorage", () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  describe("restoreAccountAnalyticsIntroductionFromStorage", () => {
    it("restores a persisted dismissal", async () => {
      mockGet.mockResolvedValueOnce({ hasDismissed: true });
      const store = createStore();

      await restoreAccountAnalyticsIntroductionFromStorage(store.dispatch);

      expect(store.getState().accountAnalyticsIntroduction.hasDismissed).toBe(true);
      expect(warn).not.toHaveBeenCalled();
    });

    it("keeps the introduction available when nothing was persisted", async () => {
      mockGet.mockResolvedValueOnce(undefined);
      const store = createStore();

      await restoreAccountAnalyticsIntroductionFromStorage(store.dispatch);

      expect(store.getState().accountAnalyticsIntroduction.hasDismissed).toBe(false);
    });

    it("keeps the default state and warns when the read fails", async () => {
      mockGet.mockRejectedValueOnce(new Error("storage unavailable"));
      const store = createStore();

      await expect(
        restoreAccountAnalyticsIntroductionFromStorage(store.dispatch),
      ).resolves.toBeUndefined();

      expect(store.getState().accountAnalyticsIntroduction.hasDismissed).toBe(false);
      expect(warn).toHaveBeenCalledTimes(1);
    });
  });

  describe("saveAccountAnalyticsIntroductionSafely", () => {
    it("persists the dismissal", async () => {
      mockSave.mockResolvedValueOnce();

      await saveAccountAnalyticsIntroductionSafely({ hasDismissed: true });

      expect(mockSave).toHaveBeenCalledWith({ hasDismissed: true });
      expect(warn).not.toHaveBeenCalled();
    });

    it("resolves and warns when the write fails", async () => {
      mockSave.mockRejectedValueOnce(new Error("storage full"));

      await expect(
        saveAccountAnalyticsIntroductionSafely({ hasDismissed: true }),
      ).resolves.toBeUndefined();

      expect(warn).toHaveBeenCalledTimes(1);
    });
  });
});
