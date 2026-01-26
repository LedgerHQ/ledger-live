import * as path from "path";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Dirent } from "fs";
import type * as fsPromises from "node:fs/promises";
import type { log as logType } from "@ledgerhq/logs";

jest.mock("fs/promises", () => ({
  readdir: jest.fn(),
  unlink: jest.fn(),
}));
jest.mock("@ledgerhq/logs", () => ({
  log: jest.fn(),
}));

let readdirMock: jest.MockedFunction<typeof fsPromises.readdir>;
let unlinkMock: jest.MockedFunction<typeof fsPromises.unlink>;
let UserDataCleanup: typeof import("./cleanupUserData").UserDataCleanup;
let logMock: jest.MockedFunction<typeof logType>;

class FakeDirent implements Dirent {
  constructor(
    public name: string,
    private readonly file: boolean,
  ) {}

  public path = "";
  public parentPath = "";

  isFile() {
    return this.file;
  }

  isDirectory() {
    return !this.file;
  }

  isBlockDevice() {
    return false;
  }

  isCharacterDevice() {
    return false;
  }

  isFIFO() {
    return false;
  }

  isSocket() {
    return false;
  }

  isSymbolicLink() {
    return false;
  }
}

const fileEntry = (name: string) => new FakeDirent(name, true);

const directoryEntry = (name: string) => new FakeDirent(name, false);

describe("UserDataCleanup", () => {
  beforeEach(async () => {
    jest.resetModules();
    const fsPromisesMock = jest.requireMock("fs/promises") as {
      readdir: jest.MockedFunction<typeof fsPromises.readdir>;
      unlink: jest.MockedFunction<typeof fsPromises.unlink>;
    };
    readdirMock = fsPromisesMock.readdir;
    unlinkMock = fsPromisesMock.unlink;
    const logsMock = jest.requireMock("@ledgerhq/logs") as {
      log: jest.MockedFunction<typeof logType>;
    };
    logMock = logsMock.log;
    readdirMock.mockReset();
    unlinkMock.mockReset();
    logMock.mockReset();
    UserDataCleanup = (await import("./cleanupUserData")).UserDataCleanup;
  });

  it("removes stale app.json.* files by default", async () => {
    readdirMock.mockResolvedValue([
      fileEntry("app.json.1"),
      fileEntry("app.json"),
      directoryEntry("nested"),
      fileEntry("other.txt"),
    ]);
    unlinkMock.mockResolvedValue(undefined);

    const cleanup = new UserDataCleanup("/tmp/userdata", {
      patterns: [/^app\.json\..+$/],
    });
    await cleanup.cleanup();

    expect(unlinkMock).toHaveBeenCalledTimes(1);
    expect(unlinkMock).toHaveBeenCalledWith(path.join("/tmp/userdata", "app.json.1"));
  });

  it("supports custom regex patterns", async () => {
    readdirMock.mockResolvedValue([fileEntry("keep.json"), fileEntry("extra.tmp")]);
    unlinkMock.mockResolvedValue(undefined);

    const cleanup = new UserDataCleanup("/data", { patterns: [/\.tmp$/] });
    await cleanup.cleanup();

    expect(unlinkMock).toHaveBeenCalledTimes(1);
    expect(unlinkMock).toHaveBeenCalledWith(path.join("/data", "extra.tmp"));
  });

  it("does nothing when no files match", async () => {
    readdirMock.mockResolvedValue([fileEntry("app.json"), fileEntry("keep.json")]);

    const cleanup = new UserDataCleanup("/tmp/userdata", {
      patterns: [/^app\.json\..+$/],
    });
    await cleanup.cleanup();

    expect(unlinkMock).not.toHaveBeenCalled();
    expect(logMock).not.toHaveBeenCalled();
  });

  it("logs failures when cleanup fails", async () => {
    readdirMock.mockResolvedValue([fileEntry("app.json.1"), fileEntry("app.json.2")]);
    unlinkMock.mockRejectedValueOnce(new Error("nope"));
    unlinkMock.mockResolvedValueOnce(undefined);

    const cleanup = new UserDataCleanup("/tmp/userdata", {
      patterns: [/^app\.json\..+$/],
    });
    await cleanup.cleanup();

    expect(logMock).toHaveBeenCalledWith("user-data", "cleanup failed for 1 file(s)");
  });

  it("silently handles ENOENT error when directory does not exist", async () => {
    const enoentError = new Error("Directory not found") as NodeJS.ErrnoException;
    enoentError.code = "ENOENT";
    readdirMock.mockRejectedValue(enoentError);

    const cleanup = new UserDataCleanup("/tmp/userdata", {
      patterns: [/^app\.json\..+$/],
    });
    await cleanup.cleanup();

    expect(logMock).not.toHaveBeenCalled();
  });

  it("logs error when readdir fails with non-ENOENT error", async () => {
    const otherError = new Error("Permission denied");
    readdirMock.mockRejectedValue(otherError);

    const cleanup = new UserDataCleanup("/tmp/userdata", {
      patterns: [/^app\.json\..+$/],
    });
    await cleanup.cleanup();

    expect(logMock).toHaveBeenCalledWith("user-data", `cleanup failed: ${String(otherError)}`);
  });
});
