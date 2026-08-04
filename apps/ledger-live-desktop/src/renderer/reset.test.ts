import { renderHook } from "tests/testSetup";
import { app, files } from "~/renderer/bridge";
import { cleanCache, resetAll } from "~/renderer/storage";
import { openUserDataFolderAndQuit, useHardReset, useSoftReset } from "./reset";

jest.mock("~/renderer/storage", () => ({
  ...jest.requireActual("~/renderer/storage"),
  resetAll: jest.fn().mockResolvedValue(undefined),
  cleanCache: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("./bridge/cache", () => ({ clearBridgeCache: jest.fn() }));

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

  it("should reload the app after a soft reset", async () => {
    const { result } = renderHook(() => useSoftReset());

    await result.current();

    expect(cleanCache).toHaveBeenCalledTimes(1);
    expect(mockWipe).toHaveBeenCalledTimes(1);
    expect(app.reload).toHaveBeenCalledTimes(1);
  });
});
