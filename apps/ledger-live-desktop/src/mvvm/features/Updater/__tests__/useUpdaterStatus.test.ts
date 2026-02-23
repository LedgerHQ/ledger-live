import React from "react";
import { renderHook } from "tests/testSetup";
import { UpdaterContext, UpdateStatus } from "~/renderer/components/Updater/UpdaterContext";
import { openURL } from "~/renderer/linking";
import {
  useUpdaterStatus,
  BANNER_VISIBLE_STATUS,
  TOP_BAR_VISIBLE_STATUS,
} from "../hooks/useUpdaterStatus";
import { createContextWrapper } from "./helpers";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

jest.mock("~/renderer/hooks/useLocalizedUrls", () => ({
  useLocalizedUrl: (url: string) => url,
}));

const createNullWrapper = () => {
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(UpdaterContext.Provider, { value: null }, children);
  Wrapper.displayName = "NullUpdaterModelTestWrapper";
  return Wrapper;
};

const ALL_STATUSES: UpdateStatus[] = [
  "idle",
  "checking-for-update",
  "update-available",
  "update-not-available",
  "download-progress",
  "update-downloaded",
  "checking",
  "check-success",
  "downloading-update",
  "error",
];

describe("useUpdaterStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when context is null", () => {
    it("should return isBannerVisible false", () => {
      const { result } = renderHook(() => useUpdaterStatus(), { wrapper: createNullWrapper() });
      expect(result.current.isBannerVisible).toBe(false);
    });

    it("should return isTopBarVisible false", () => {
      const { result } = renderHook(() => useUpdaterStatus(), { wrapper: createNullWrapper() });
      expect(result.current.isTopBarVisible).toBe(false);
    });

    it("should return undefined from getActionHandler", () => {
      const { result } = renderHook(() => useUpdaterStatus(), { wrapper: createNullWrapper() });
      const handler = result.current.getActionHandler("check-success");
      expect(handler).toBeUndefined();
    });
  });

  describe("isBannerVisible", () => {
    it("should be false when version is undefined", () => {
      const { result } = renderHook(() => useUpdaterStatus(), {
        wrapper: createContextWrapper({ status: "update-available", version: undefined }),
      });
      expect(result.current.isBannerVisible).toBe(false);
    });

    it.each(ALL_STATUSES)("status '%s' → isBannerVisible = %s", status => {
      const { result } = renderHook(() => useUpdaterStatus(), {
        wrapper: createContextWrapper({ status }),
      });
      expect(result.current.isBannerVisible).toBe(BANNER_VISIBLE_STATUS.includes(status));
    });
  });

  describe("isTopBarVisible", () => {
    it.each(ALL_STATUSES)("status '%s' → isTopBarVisible = %s", status => {
      const { result } = renderHook(() => useUpdaterStatus(), {
        wrapper: createContextWrapper({ status }),
      });
      expect(result.current.isTopBarVisible).toBe(TOP_BAR_VISIBLE_STATUS.includes(status));
    });
  });

  describe("getActionHandler", () => {
    it("should return quitAndInstall for check-success", () => {
      const quitAndInstall = jest.fn();
      const { result } = renderHook(() => useUpdaterStatus(), {
        wrapper: createContextWrapper({ status: "check-success", quitAndInstall }),
      });

      result.current.getActionHandler("check-success")?.();
      expect(quitAndInstall).toHaveBeenCalledTimes(1);
    });

    it("should return reDownload (openURL) for error", () => {
      const { result } = renderHook(() => useUpdaterStatus(), {
        wrapper: createContextWrapper({ status: "error" }),
      });

      result.current.getActionHandler("error")?.();
      expect(openURL).toHaveBeenCalledTimes(1);
    });

    it("should return undefined for non-actionable statuses", () => {
      const { result } = renderHook(() => useUpdaterStatus(), {
        wrapper: createContextWrapper({ status: "update-available" }),
      });

      expect(result.current.getActionHandler("update-available")).toBeUndefined();
    });
  });
});
