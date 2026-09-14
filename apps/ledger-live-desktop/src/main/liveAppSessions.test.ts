// `jest` is deliberately not imported from @jest/globals: that disables
// jest.mock hoisting, and "electron" would resolve before the mock registers.
import { beforeEach, describe, expect, it } from "@jest/globals";
import * as fsPromises from "node:fs/promises";
import { session } from "electron";
import {
  clearLiveAppSessionsCache,
  clearLiveAppSessionsStorage,
  trackLiveAppSession,
} from "./liveAppSessions";

jest.mock("electron", () => {
  const defaultSession = { clearCache: jest.fn(), clearStorageData: jest.fn() };
  return {
    app: { getPath: jest.fn(() => "/userData") },
    session: {
      defaultSession,
      fromPartition: jest.fn(),
    },
  };
});

jest.mock("node:fs/promises", () => ({ readdir: jest.fn() }));

const makeSession = () => ({
  clearCache: jest.fn(async () => {}),
  clearStorageData: jest.fn(async () => {}),
});

const mockedReaddir = jest.mocked(fsPromises.readdir);
const mockedFromPartition = jest.mocked(session.fromPartition);

const asDirents = (names: string[]) =>
  names.map(name => ({ name, isDirectory: () => true })) as unknown as ReturnType<
    typeof mockedReaddir
  > extends Promise<infer T>
    ? T
    : never;

describe("live app session clearing", () => {
  const sharedSession = makeSession();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedReaddir.mockResolvedValue([] as never);
    mockedFromPartition.mockReturnValue(sharedSession as unknown as Electron.Session);
  });

  it("always clears the shared Live App partition, even before any app was opened", async () => {
    await clearLiveAppSessionsStorage();

    expect(mockedFromPartition).toHaveBeenCalledWith("persist:live-app-shared");
    expect(sharedSession.clearStorageData).toHaveBeenCalled();
  });

  it("clears the cache of a partition attached during this run", async () => {
    const guestSession = makeSession() as unknown as Electron.Session;
    trackLiveAppSession(guestSession);

    await clearLiveAppSessionsCache();

    expect(guestSession.clearCache).toHaveBeenCalled();
  });

  it("never tracks the default session, which is the host renderer's", async () => {
    trackLiveAppSession(session.defaultSession);

    await clearLiveAppSessionsStorage();

    expect(session.defaultSession.clearStorageData).not.toHaveBeenCalled();
  });

  it("clears partitions persisted by a previous run that was never reopened", async () => {
    const persisted = makeSession();
    mockedReaddir.mockResolvedValue(asDirents(["live-app-someapp-3"]) as never);
    mockedFromPartition.mockImplementation(partition =>
      partition === "persist:live-app-someapp-3"
        ? (persisted as unknown as Electron.Session)
        : (sharedSession as unknown as Electron.Session),
    );

    await clearLiveAppSessionsStorage();

    expect(persisted.clearStorageData).toHaveBeenCalled();
  });

  it("clears a partition left on disk by a version predating the shared one", async () => {
    // The pinned `<idSlug>-<cacheBustingId>` naming is unchanged for exactly
    // this reason: every existing install still gets its tokens dropped.
    const legacy = makeSession();
    mockedReaddir.mockResolvedValue(asDirents(["1inch-1"]) as never);
    mockedFromPartition.mockImplementation(partition =>
      partition === "persist:1inch-1"
        ? (legacy as unknown as Electron.Session)
        : (sharedSession as unknown as Electron.Session),
    );

    await clearLiveAppSessionsStorage();

    expect(legacy.clearStorageData).toHaveBeenCalled();
  });

  it("deduplicates a partition that is both attached and on disk", async () => {
    const guestSession = makeSession();
    trackLiveAppSession(guestSession as unknown as Electron.Session);
    mockedReaddir.mockResolvedValue(asDirents(["live-app-dupe"]) as never);
    mockedFromPartition.mockImplementation(partition =>
      partition === "persist:live-app-dupe"
        ? (guestSession as unknown as Electron.Session)
        : (sharedSession as unknown as Electron.Session),
    );

    await clearLiveAppSessionsStorage();

    expect(guestSession.clearStorageData).toHaveBeenCalledTimes(1);
  });

  it("ignores partitions that are not a Live App's", async () => {
    // `fromPartition` also creates the session it names, and another feature's
    // storage is not ours to wipe.
    mockedReaddir.mockResolvedValue(asDirents(["some-other-feature"]) as never);

    await clearLiveAppSessionsStorage();

    expect(mockedFromPartition).not.toHaveBeenCalledWith("persist:some-other-feature");
  });

  it("still clears the other partitions when one of them throws", async () => {
    const failing = makeSession();
    failing.clearStorageData.mockRejectedValue(new Error("locked") as never);
    trackLiveAppSession(failing as unknown as Electron.Session);

    await expect(clearLiveAppSessionsStorage()).resolves.toBeUndefined();
    expect(sharedSession.clearStorageData).toHaveBeenCalled();
  });

  it("survives a missing Partitions directory", async () => {
    const enoent = Object.assign(new Error("no such dir"), { code: "ENOENT" });
    mockedReaddir.mockRejectedValue(enoent as never);

    await expect(clearLiveAppSessionsCache()).resolves.toBeUndefined();
    expect(sharedSession.clearCache).toHaveBeenCalled();
  });
});
