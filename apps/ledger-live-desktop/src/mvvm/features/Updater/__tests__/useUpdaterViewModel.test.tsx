import { renderHook } from "tests/testSetup";
import { UpdateStatus } from "~/renderer/components/Updater/UpdaterContext";
import useUpdaterViewModel from "../hooks/useUpdaterViewModel";
import { createContextWrapper } from "./helpers";

describe("useUpdaterViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const hiddenStatuses: UpdateStatus[] = [
    "idle",
    "update-not-available",
    "checking-for-update",
    "checking",
    "downloading-update",
    "update-downloaded",
  ];

  it.each(hiddenStatuses)("should return null when status is %s", status => {
    const { result } = renderHook(() => useUpdaterViewModel(), {
      wrapper: createContextWrapper({ status }),
    });

    expect(result.current).toBeNull();
  });

  it("should return base appearance when status is update-available", () => {
    const { result } = renderHook(() => useUpdaterViewModel(), {
      wrapper: createContextWrapper({ status: "update-available" }),
    });

    expect(result.current).toEqual(
      expect.objectContaining({
        appearance: "base",
        isLoading: false,
      }),
    );
  });

  it("should return loading state with progress label when status is download-progress", () => {
    const { result } = renderHook(() => useUpdaterViewModel(), {
      wrapper: createContextWrapper({ status: "download-progress", downloadProgress: 42 }),
    });

    expect(result.current).toEqual(
      expect.objectContaining({
        appearance: "base",
        isLoading: true,
      }),
    );
    expect(result.current?.label).toContain("42");
  });

  it("should return red appearance when status is error", () => {
    const { result } = renderHook(() => useUpdaterViewModel(), {
      wrapper: createContextWrapper({ status: "error" }),
    });

    expect(result.current).toEqual(
      expect.objectContaining({
        appearance: "red",
        isLoading: false,
      }),
    );
  });

  it("should return base appearance when status is check-success", () => {
    const { result } = renderHook(() => useUpdaterViewModel(), {
      wrapper: createContextWrapper({ status: "check-success" }),
    });

    expect(result.current).toEqual(
      expect.objectContaining({
        appearance: "base",
        isLoading: false,
      }),
    );
  });

  it("should wire quitAndInstall as onClick when status is check-success", () => {
    const quitAndInstall = jest.fn();
    const { result } = renderHook(() => useUpdaterViewModel(), {
      wrapper: createContextWrapper({ status: "check-success", quitAndInstall }),
    });

    result.current?.onClick();
    expect(quitAndInstall).toHaveBeenCalledTimes(1);
  });
});
