import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import fs from "fs/promises";

const readFileMock = jest.fn<(path: string) => Promise<Buffer>>();
const writeFileMock = jest.fn<(path: string, data: string) => Promise<void>>();

jest.mock("~/main/db/fsHelper", () => ({
  readFile: (path: string) => readFileMock(path),
  writeFile: (path: string, data: string) => writeFileMock(path, data),
}));

describe("db (app namespace allow list + keepLegacy)", () => {
  let db: typeof import("./index").default;
  const testDir = "/tmp/db-test";

  beforeEach(async () => {
    jest.resetModules();
    readFileMock.mockReset();
    writeFileMock.mockReset();
    writeFileMock.mockResolvedValue(undefined);
    db = (await import("./index")).default;
    db.init(testDir);
  });

  afterEach(async () => {
    await db.flush();
  });

  const wrongPassword = { name: "DBWrongPassword" };

  function appJson(data: Record<string, unknown>) {
    return Buffer.from(JSON.stringify({ data }), "utf-8");
  }

  function getWrittenData(): Record<string, unknown> {
    expect(writeFileMock).toHaveBeenCalled();
    const call = writeFileMock.mock.calls[writeFileMock.mock.calls.length - 1];
    const content = call[1];
    const parsed = JSON.parse(content);
    return parsed.data as Record<string, unknown>;
  }

  function expectEncryptedAttributes(data: Record<string, unknown>) {
    expect(typeof data.accounts).toBe("string");
    expect(typeof data.trustchain).toBe("string");
    expect(typeof data.wallet).toBe("string");
  }

  function expectUnencryptedAttributes(data: Record<string, unknown>) {
    if (data.accounts !== undefined) {
      expect(typeof data.accounts).toBe("object");
    }
    expect(typeof data.trustchain).toBe("object");
    expect(typeof data.wallet).toBe("object");
  }

  it("drops unknown keys at load and does not write them back", async () => {
    readFileMock.mockResolvedValueOnce(
      appJson({
        settings: { loaded: true },
        _this_is_not_valid_field_: "junk",
      }),
    );
    const settings = await db.getKey("app", "settings", undefined);
    expect(settings).toEqual({ loaded: true });
    const unknown = await db.getKey("app", "_this_is_not_valid_field_", undefined);
    expect(unknown).toBeUndefined();

    await db.setKey("app", "settings", { loaded: true });
    await db.flush();

    const written = getWrittenData();
    expect(written.settings).toEqual({ loaded: true });
    expect((written as Record<string, unknown>)._this_is_not_valid_field_).toBeUndefined();
  });

  it("writes both files when a windowParams save follows an app save within the debounce delay", async () => {
    readFileMock.mockResolvedValue(appJson({}));

    await Promise.all([
      db.setKey("app", "settings", { saved: true }),
      db.setKey("windowParams", "MainWindow", { width: 800 }),
    ]);
    await db.flush();

    const writtenPaths = writeFileMock.mock.calls.map(([path]) => path);
    expect(writtenPaths).toContain(`${testDir}/app.json`);
    expect(writtenPaths).toContain(`${testDir}/windowParams.json`);
    const appCall = writeFileMock.mock.calls.find(([path]) => path === `${testDir}/app.json`)!;
    expect(JSON.parse(appCall[1]).data.settings).toEqual({ saved: true });
  });

  it("keeps user in file until identities is written", async () => {
    readFileMock.mockResolvedValueOnce(
      appJson({
        user: { id: "legacy-user-id" },
      }),
    );
    const user = await db.getKey("app", "user", undefined);
    expect(user).toEqual({ id: "legacy-user-id" });

    await db.setKey("app", "settings", {});
    await db.flush();

    let written = getWrittenData();
    expect(written.user).toEqual({ id: "legacy-user-id" });

    await db.setKey("app", "identities", { userId: "new-id" });
    await db.flush();

    written = getWrittenData();
    expect(written.identities).toEqual({ userId: "new-id" });
    expect(written.user).toBeUndefined();
  });

  it("rejects setKey on unknown app key paths (detect divergence early)", async () => {
    readFileMock.mockResolvedValueOnce(appJson({}));
    await expect(db.setKey("app", "_unknown_top_level_", 1)).rejects.toThrow(/unknown key path/);
    await expect(db.setKey("app", "_unknown_.nested", 1)).rejects.toThrow(/unknown key path/);
  });

  it("allows setKey under an allowed top-level key (nested path)", async () => {
    readFileMock.mockResolvedValueOnce(appJson({ settings: {} }));
    await expect(db.setKey("app", "settings.deep", { x: 1 })).resolves.toBeUndefined();
  });

  it("allows knownDevices persistence", async () => {
    readFileMock.mockResolvedValueOnce(appJson({}));
    await expect(db.setKey("app", "knownDevices", { knownDevices: [] })).resolves.toBeUndefined();
  });

  it("should preserve Analytics introduction dismissal after saving and reloading the database", async () => {
    readFileMock.mockResolvedValueOnce(appJson({}));
    const dismissal = { hasDismissed: true };

    await db.setKey("app", "accountAnalyticsIntroduction", dismissal);
    await db.flush();

    const persisted = getWrittenData();
    expect(persisted.accountAnalyticsIntroduction).toEqual(dismissal);
    readFileMock.mockResolvedValueOnce(appJson(persisted));
    db.init(testDir);

    expect(await db.getKey("app", "accountAnalyticsIntroduction", undefined)).toEqual(dismissal);
  });

  it("preserves allowed and keepLegacy keys on load", async () => {
    readFileMock.mockResolvedValueOnce(
      appJson({
        settings: { a: 1 },
        identities: { userId: "u" },
        knownDevices: { knownDevices: [] },
        user: { id: "legacy" },
      }),
    );
    expect(await db.getKey("app", "settings", undefined)).toEqual({ a: 1 });
    expect(await db.getKey("app", "identities", undefined)).toEqual({ userId: "u" });
    expect(await db.getKey("app", "knownDevices", undefined)).toEqual({ knownDevices: [] });
    expect(await db.getKey("app", "user", undefined)).toEqual({ id: "legacy" });
  });

  it("persists password lock with no accounts", async () => {
    readFileMock.mockResolvedValueOnce(appJson({ settings: { loaded: true } }));

    await db.setEncryptionKey("test-password");

    const persisted = getWrittenData();
    expectEncryptedAttributes(persisted);

    readFileMock.mockResolvedValueOnce(appJson(persisted));
    db.init(testDir);
    await db.load("app");

    expect(await db.hasBeenDecrypted()).toBe(false);
  });

  it("decrypts persisted encrypted paths when unlocking", async () => {
    readFileMock.mockResolvedValueOnce(appJson({ settings: { loaded: true } }));

    await db.setEncryptionKey("test-password");
    const persisted = getWrittenData();

    readFileMock.mockResolvedValueOnce(appJson(persisted));
    db.init(testDir);
    await db.load("app");

    await db.setEncryptionKey("test-password");

    expect(await db.hasBeenDecrypted()).toBe(true);
    expect(typeof (await db.getKey("app", "trustchain", undefined))).toBe("object");
    expect(typeof (await db.getKey("app", "wallet", undefined))).toBe("object");
  });

  it("rolls back a wrong password so it neither passes the check nor re-encrypts the data", async () => {
    readFileMock.mockResolvedValueOnce(appJson({ settings: { loaded: true } }));
    await db.setEncryptionKey("test-password");
    const persisted = getWrittenData();

    readFileMock.mockResolvedValueOnce(appJson(persisted));
    db.init(testDir);
    await db.load("app");

    await expect(db.setEncryptionKey("wrong-password")).rejects.toThrow();
    expect(db.isEncryptionKeyCorrect("wrong-password")).toBe(false);
    expect(db.hasEncryptionKey()).toBe(false);

    await db.setKey("app", "settings", { loaded: true, touched: true });
    await db.flush();
    readFileMock.mockResolvedValueOnce(appJson(getWrittenData()));
    db.init(testDir);
    await db.load("app");

    await db.setEncryptionKey("test-password");
    expect(await db.hasBeenDecrypted()).toBe(true);
    expect(typeof (await db.getKey("app", "wallet", undefined))).toBe("object");
  });

  it("keeps every path encrypted when a later path fails to decrypt", async () => {
    readFileMock.mockResolvedValueOnce(
      appJson({ settings: { loaded: true }, accounts: [{ id: "account-1" }] }),
    );
    await db.setEncryptionKey("test-password");
    const persisted: Record<string, unknown> = { ...getWrittenData(), trustchain: "corrupted" };

    readFileMock.mockResolvedValueOnce(appJson(persisted));
    db.init(testDir);
    await db.load("app");

    await expect(db.setEncryptionKey("test-password")).rejects.toMatchObject(wrongPassword);
    expect(await db.getKey("app", "accounts", undefined)).toBe(persisted.accounts);
    expect(db.hasEncryptionKey()).toBe(false);

    await db.setKey("app", "settings", { loaded: true, touched: true });
    await db.flush();
    expect(getWrittenData().accounts).toBe(persisted.accounts);
  });

  it("rejects an empty ciphertext instead of committing the key", async () => {
    readFileMock.mockResolvedValueOnce(appJson({ settings: { loaded: true } }));
    await db.setEncryptionKey("test-password");
    const persisted: Record<string, unknown> = { ...getWrittenData(), trustchain: "" };

    readFileMock.mockResolvedValueOnce(appJson(persisted));
    db.init(testDir);
    await db.load("app");

    await expect(db.setEncryptionKey("test-password")).rejects.toMatchObject(wrongPassword);
    expect(db.hasEncryptionKey()).toBe(false);
    expect(await db.getKey("app", "accounts", undefined)).toBe(persisted.accounts);
  });

  it("rejects a missing or empty key, even after a failed unlock", async () => {
    readFileMock.mockResolvedValueOnce(appJson({ settings: { loaded: true } }));
    await db.setEncryptionKey("test-password");
    const persisted = getWrittenData();

    readFileMock.mockResolvedValueOnce(appJson(persisted));
    db.init(testDir);
    await db.load("app");
    await expect(db.setEncryptionKey("wrong-password")).rejects.toMatchObject(wrongPassword);

    const missingKey = undefined as unknown as string;
    expect(db.isEncryptionKeyCorrect(missingKey)).toBe(false);
    expect(db.isEncryptionKeyCorrect("")).toBe(false);
    await expect(db.setEncryptionKey(missingKey)).rejects.toMatchObject(wrongPassword);
  });

  it("uses in-memory values when encrypting paths that are already set", async () => {
    readFileMock.mockResolvedValueOnce(
      appJson({
        settings: { loaded: true },
        accounts: [{ id: "account-1" }],
      }),
    );
    await db.load("app");

    await db.setEncryptionKey("test-password");

    expectEncryptedAttributes(getWrittenData());
    expect(await db.getKey("app", "accounts", undefined)).toEqual([{ id: "account-1" }]);
  });

  it("removeEncryptionKey clears encryption after empty lock", async () => {
    readFileMock.mockResolvedValueOnce(appJson({ settings: { loaded: true } }));

    await db.setEncryptionKey("test-password");
    expectEncryptedAttributes(getWrittenData());

    await db.removeEncryptionKey("test-password");

    expectUnencryptedAttributes(getWrittenData());
  });

  it("resolves true only when it checked a password", async () => {
    readFileMock.mockResolvedValueOnce(appJson({ settings: { loaded: true } }));
    await expect(db.setEncryptionKey("test-password")).resolves.toBe(false);
    const persisted = getWrittenData();

    readFileMock.mockResolvedValueOnce(appJson(persisted));
    db.init(testDir);
    await db.load("app");

    await expect(db.removeEncryptionKey()).resolves.toBe(false);
    await expect(db.setEncryptionKey("test-password")).resolves.toBe(true);
  });

  it("requires the held key to replace or remove it while the db is decrypted", async () => {
    readFileMock.mockResolvedValueOnce(appJson({ settings: { loaded: true } }));
    await db.setEncryptionKey("test-password");

    await expect(db.setEncryptionKey("other-password")).rejects.toMatchObject(wrongPassword);
    await expect(db.setEncryptionKey("other-password", "wrong-password")).rejects.toMatchObject(
      wrongPassword,
    );
    await expect(db.removeEncryptionKey()).rejects.toMatchObject(wrongPassword);
    await expect(db.removeEncryptionKey("wrong-password")).rejects.toMatchObject(wrongPassword);
    expect(db.isEncryptionKeyCorrect("test-password")).toBe(true);

    await expect(db.setEncryptionKey("new-password", "test-password")).resolves.toBe(true);
    expect(db.isEncryptionKeyCorrect("new-password")).toBe(true);
    await expect(db.removeEncryptionKey("new-password")).resolves.toBe(true);
    expect(db.hasEncryptionKey()).toBe(false);
  });
});

function writtenFile(ns: string): Record<string, unknown> | undefined {
  const call = [...writeFileMock.mock.calls]
    .reverse()
    .find(([filePath]) => filePath.endsWith(`${ns}.json`));
  return call && (JSON.parse(call[1]).data as Record<string, unknown>);
}

function blockNextWrite(): () => void {
  let finishWrite: (() => void) | undefined;
  writeFileMock.mockImplementationOnce(() => new Promise<void>(resolve => (finishWrite = resolve)));
  return () => finishWrite?.();
}

const waitMs = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe("db flush", () => {
  let db: typeof import("./index").default;
  const testDir = "/tmp/db-test";

  beforeEach(async () => {
    jest.resetModules();
    readFileMock.mockReset();
    writeFileMock.mockReset();
    readFileMock.mockResolvedValue(Buffer.from(JSON.stringify({ data: {} }), "utf-8"));
    writeFileMock.mockResolvedValue(undefined);
    db = (await import("./index")).default;
    db.init(testDir);
  });

  afterEach(async () => {
    jest.useRealTimers();
    await db.flush();
  });

  it("writes a pending save at once", async () => {
    jest.useFakeTimers();
    const saved = db.setKey("app", "settings", { theme: "dark" });
    await jest.advanceTimersByTimeAsync(0);
    expect(writtenFile("app")).toBeUndefined();

    await db.flush();

    expect(writtenFile("app")).toEqual({ settings: { theme: "dark" } });
    await expect(saved).resolves.toBeUndefined();
  });

  it("resolves setKey before the disk write, and flush writes it", async () => {
    await db.setKey("app", "settings", { theme: "dark" });
    expect(writeFileMock).not.toHaveBeenCalled();
    await expect(db.getKey("app", "settings")).resolves.toEqual({ theme: "dark" });

    await db.flush();
    expect(writtenFile("app")).toEqual({ settings: { theme: "dark" } });
  });

  it("logs a failed save, as setKey has already resolved", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    writeFileMock.mockRejectedValueOnce(new Error("disk full"));

    await db.setKey("app", "settings", { theme: "dark" });
    await db.flush();

    expect(consoleError).toHaveBeenCalledWith("[db] app.json save failed", expect.any(Error));
    consoleError.mockRestore();
  });

  it("logs a failed save once for all the setKey calls it holds", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    writeFileMock.mockRejectedValueOnce(new Error("disk full"));

    await db.setKey("windowParams", "MainWindow.positions", { x: 1, y: 2 });
    await db.setKey("windowParams", "MainWindow.positions", { x: 3, y: 4 });
    await db.setKey("windowParams", "MainWindow.positions", { x: 5, y: 6 });
    await db.flush();

    expect(consoleError).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });

  it("waits for a save that is already in progress", async () => {
    const finishWrite = blockNextWrite();
    const saved = db.setKey("app", "settings", { theme: "dark" });
    await waitMs(50);
    expect(writeFileMock).toHaveBeenCalledTimes(1);

    let flushed = false;
    const flushing = db.flush().then(() => (flushed = true));
    await waitMs(0);
    expect(flushed).toBe(false);

    finishWrite();
    await flushing;
    await saved;
    expect(flushed).toBe(true);
  });

  it("waits for each write of a namespace, not only the last one", async () => {
    const finishFirstWrite = blockNextWrite();
    void db.setKey("app", "settings", { theme: "dark" });
    await waitMs(50);
    void db.setKey("app", "settings", { theme: "light" });
    await waitMs(50);

    let flushed = false;
    const flushing = db.flush().then(() => (flushed = true));
    await waitMs(0);
    expect(flushed).toBe(false);

    finishFirstWrite();
    await flushing;
    expect(writtenFile("app")).toEqual({ settings: { theme: "light" } });
  });

  it("waits for a second save whose timer fires while the flush waits", async () => {
    const finishFirstWrite = blockNextWrite();
    const finishSecondWrite = blockNextWrite();
    void db.setKey("app", "settings", { theme: "dark" });
    await waitMs(50);

    let flushed = false;
    const flushing = db.flush().then(() => (flushed = true));
    void db.setKey("app", "settings", { theme: "light" });
    await waitMs(50);
    finishFirstWrite();
    await waitMs(0);
    expect(writeFileMock).toHaveBeenCalledTimes(2);
    expect(flushed).toBe(false);

    finishSecondWrite();
    await flushing;
    expect(writtenFile("app")).toEqual({ settings: { theme: "light" } });
  });

  it("writes a namespace first saved while the flush waits", async () => {
    const finishWrite = blockNextWrite();
    void db.setKey("app", "settings", { theme: "dark" });
    await waitMs(50);

    const flushing = db.flush();
    void db.setKey("windowParams", "MainWindow.positions", { x: 1, y: 2 });
    await waitMs(0);
    finishWrite();
    await flushing;

    expect(writtenFile("windowParams")).toEqual({ MainWindow: { positions: { x: 1, y: 2 } } });
  });

  it("does not deadlock on a save that was pending at reset", async () => {
    void db.setKey("app", "settings", { theme: "dark" });
    await waitMs(0);
    readFileMock.mockRejectedValue(Object.assign(new Error("missing"), { code: "ENOENT" }));
    await db.resetAll();
    writeFileMock.mockClear();

    await db.flush();

    expect(writtenFile("app")).toBeUndefined();
    await expect(db.getKey("app", "settings")).resolves.toBeUndefined();
  });

  it("deletes app.json after the save that is already in progress", async () => {
    const unlink = jest.spyOn(fs, "unlink");
    const finishWrite = blockNextWrite();
    void db.setKey("app", "settings", { theme: "dark" });
    await waitMs(50);
    expect(writeFileMock).toHaveBeenCalledTimes(1);

    const resetting = db.resetAll();
    await waitMs(0);
    expect(unlink).not.toHaveBeenCalled();

    finishWrite();
    await resetting;
    expect(unlink).toHaveBeenCalledWith(`${testDir}/app.json`);
    unlink.mockRestore();
  });

  it("does not load the old app.json again for a setKey during the reset", async () => {
    readFileMock.mockResolvedValue(Buffer.from(JSON.stringify({ data: { settings: "old" } })));
    const finishWrite = blockNextWrite();
    void db.setKey("app", "settings", "old");
    await waitMs(50);

    const resetting = db.resetAll();
    await waitMs(0);
    const setting = db.setKey("app", "accounts", []);
    await waitMs(0);
    readFileMock.mockRejectedValue(Object.assign(new Error("missing"), { code: "ENOENT" }));
    finishWrite();
    await resetting;
    await setting;
    writeFileMock.mockClear();
    await db.flush();

    expect(writtenFile("app")).toEqual({ accounts: [] });
  });

  it("writes a pending save before reload clears the memory", async () => {
    jest.useFakeTimers();
    void db.setKey("windowParams", "MainWindow.positions", { x: 1, y: 2 });
    await jest.advanceTimersByTimeAsync(0);

    await db.reload();

    expect(writtenFile("windowParams")).toEqual({ MainWindow: { positions: { x: 1, y: 2 } } });
  });

  it("does not serve the memory of the previous session while a reload saves it", async () => {
    readFileMock.mockResolvedValue(Buffer.from(JSON.stringify({ data: { settings: "disk" } })));
    await db.setKey("app", "settings", "memory");
    await db.flush();
    const finishWrite = blockNextWrite();
    void db.setKey("app", "settings", "pending");
    await waitMs(0);

    const reloaded = db.reload();
    let read: unknown;
    const reading = db.getKey("app", "settings").then(value => (read = value));
    await waitMs(50);
    expect(writeFileMock).toHaveBeenCalledTimes(2);
    expect(read).toBeUndefined();

    finishWrite();
    await reloaded;
    await reading;
    expect(read).toBe("disk");
  });

  it.each([
    ["setKey", (d: typeof db) => d.setKey("app", "settings", "new")],
    ["setEncryptionKey", (d: typeof db) => d.setEncryptionKey("password")],
    ["removeEncryptionKey", (d: typeof db) => d.removeEncryptionKey()],
    ["resetAll", (d: typeof db) => d.resetAll()],
  ])("waits for the reload before %s", async (_name, call) => {
    await db.setKey("app", "settings", "memory");
    await db.flush();
    const finishWrite = blockNextWrite();
    void db.setKey("app", "settings", "pending");
    await waitMs(0);
    const reloaded = db.reload();

    let done = false;
    const calling = call(db)
      .catch(() => undefined)
      .then(() => (done = true));
    await waitMs(50);
    expect(done).toBe(false);

    finishWrite();
    await reloaded;
    await calling;
    expect(done).toBe(true);
  });
});
