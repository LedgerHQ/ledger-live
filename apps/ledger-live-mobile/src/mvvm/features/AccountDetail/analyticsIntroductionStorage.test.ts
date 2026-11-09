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
    jest.clearAllMocks();
    warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  describe("restoreAccountAnalyticsIntroductionFromStorage", () => {
    it("restores a persisted dismissal", async () => {
      mockGet.mockResolvedValueOnce({ hasDismissed: true });
      const store = createStore();

      await restoreAccountAnalyticsIntroductionFromStorage(store, true);

      expect(store.getState().accountAnalyticsIntroduction.hasDismissed).toBe(true);
      expect(mockSave).toHaveBeenCalledWith({ hasDismissed: true, isEligible: true });
      expect(warn).not.toHaveBeenCalled();
    });

    it.each([true, false])(
      "records the eligibility snapshot %s when nothing was persisted",
      async hasOnboardedWithDevice => {
        mockGet.mockResolvedValueOnce(undefined);
        const store = createStore();

        await restoreAccountAnalyticsIntroductionFromStorage(store, hasOnboardedWithDevice);

        expect(store.getState().accountAnalyticsIntroduction).toEqual({
          hasDismissed: false,
          isEligible: hasOnboardedWithDevice,
        });
        expect(mockSave).toHaveBeenCalledWith({
          hasDismissed: false,
          isEligible: hasOnboardedWithDevice,
        });
      },
    );

    it("keeps a persisted eligibility snapshot instead of recording a new one", async () => {
      mockGet.mockResolvedValueOnce({ hasDismissed: false, isEligible: false });
      const store = createStore();

      await restoreAccountAnalyticsIntroductionFromStorage(store, true);

      expect(store.getState().accountAnalyticsIntroduction.isEligible).toBe(false);
      expect(mockSave).not.toHaveBeenCalled();
    });

    it("keeps the default state, records no snapshot and warns when the read fails", async () => {
      mockGet.mockRejectedValueOnce(new Error("storage unavailable"));
      const store = createStore();

      await expect(
        restoreAccountAnalyticsIntroductionFromStorage(store, true),
      ).resolves.toBeUndefined();

      expect(store.getState().accountAnalyticsIntroduction).toEqual({
        hasDismissed: false,
        isEligible: null,
      });
      expect(mockSave).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalledTimes(1);
    });
  });

  describe("saveAccountAnalyticsIntroductionSafely", () => {
    it("persists the dismissal", async () => {
      mockSave.mockResolvedValueOnce();

      await saveAccountAnalyticsIntroductionSafely({ hasDismissed: true, isEligible: true });

      expect(mockSave).toHaveBeenCalledWith({ hasDismissed: true, isEligible: true });
      expect(warn).not.toHaveBeenCalled();
    });

    it("resolves and warns when the write fails", async () => {
      mockSave.mockRejectedValueOnce(new Error("storage full"));

      await expect(
        saveAccountAnalyticsIntroductionSafely({ hasDismissed: true, isEligible: true }),
      ).resolves.toBeUndefined();

      expect(warn).toHaveBeenCalledTimes(1);
    });
  });
});
