import { renderHook, waitFor } from "tests/testSetup";
import { app, files, store } from "~/renderer/bridge";
import { cleanCache, resetAll } from "~/renderer/storage";
import { persistence } from "~/persistence/composition";
import { openUserDataFolderAndQuit, useHardReset, useSoftReset } from "./reset";

jest.mock("~/renderer/storage", () => ({
  ...jest.requireActual("~/renderer/storage"),
  resetAll: jest.fn().mockResolvedValue(undefined),
  cleanCache: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("./bridge/cache", () => ({ clearBridgeCache: jest.fn() }));

jest.mock("~/persistence/composition", () => ({
  persistence: {
    stop: jest.fn().mockResolvedValue(undefined),
    resume: jest.fn(),
    flush: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("@ledgerhq/live-common/promise", () => ({
  ...jest.requireActual("@ledgerhq/live-common/promise"),
  delay: jest.fn().mockResolvedValue(undefined),
}));

const mockWipe = jest.fn();
jest.mock("@features/platform-market-countervalues", () => ({
  ...jest.requireActual("@features/platform-market-countervalues"),
  useCountervaluesPolling: () => ({ wipe: mockWipe }),
}));

describe("reset", () => {
  it("should quit only once the user data directory is open", async () => {
    let resolveOpen: ((value: unknown) => void) | undefined;
    jest
      .mocked(files.openUserDataDirectory)
      .mockReturnValueOnce(new Promise(resolve => (resolveOpen = resolve)));

    const done = openUserDataFolderAndQuit();
    expect(app.quit).not.toHaveBeenCalled();
    resolveOpen?.(undefined);
    await done;

    expect(app.quit).toHaveBeenCalledTimes(1);
  });

  it("should relaunch the app after a hard reset", async () => {
    const { result } = renderHook(() => useHardReset());

    await result.current();

    expect(resetAll).toHaveBeenCalledTimes(1);
    expect(app.relaunch).toHaveBeenCalledTimes(1);
  });

  it("should relaunch only once the store is cleared", async () => {
    let resolveClear: (() => void) | undefined;
    jest
      .mocked(store.clear)
      .mockReturnValueOnce(new Promise<void>(resolve => (resolveClear = resolve)));
    const { result } = renderHook(() => useHardReset());

    const done = result.current();
    await waitFor(() => expect(store.clear).toHaveBeenCalledTimes(1));
    expect(app.relaunch).not.toHaveBeenCalled();
    resolveClear?.();
    await done;

    expect(app.relaunch).toHaveBeenCalledTimes(1);
  });

  it("should not relaunch when the store cannot be cleared", async () => {
    jest.mocked(store.clear).mockRejectedValueOnce(new Error("EBUSY"));
    const { result } = renderHook(() => useHardReset());

    await expect(result.current()).rejects.toThrow("EBUSY");

    expect(app.relaunch).not.toHaveBeenCalled();
  });

  it("should stop persistence before it resets the stored data", async () => {
    const calls: string[] = [];
    jest.mocked(persistence.stop).mockImplementationOnce(async () => {
      calls.push("stop");
    });
    jest.mocked(resetAll).mockImplementationOnce(async () => {
      calls.push("resetAll");
    });
    const { result } = renderHook(() => useHardReset());

    await result.current();

    expect(calls).toEqual(["stop", "resetAll"]);
  });

  it("should resume persistence when the reset of the stored data fails", async () => {
    jest.mocked(resetAll).mockRejectedValueOnce(new Error("disk"));
    const { result } = renderHook(() => useHardReset());

    await expect(result.current()).rejects.toThrow("disk");

    expect(persistence.resume).toHaveBeenCalledTimes(1);
    expect(app.relaunch).not.toHaveBeenCalled();
  });

  it("should reload the app after a soft reset", async () => {
    const { result } = renderHook(() => useSoftReset());

    await result.current();

    expect(cleanCache).toHaveBeenCalledTimes(1);
    expect(persistence.flush).toHaveBeenCalledTimes(1);
    expect(mockWipe).toHaveBeenCalledTimes(1);
    expect(app.reload).toHaveBeenCalledTimes(1);
  });
});
