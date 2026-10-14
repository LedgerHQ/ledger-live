import { beforeEach, describe, expect, it, jest } from "@jest/globals";

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

    const written = getWrittenData();
    expect(written.settings).toEqual({ loaded: true });
    expect((written as Record<string, unknown>)._this_is_not_valid_field_).toBeUndefined();
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

    let written = getWrittenData();
    expect(written.user).toEqual({ id: "legacy-user-id" });

    await db.setKey("app", "identities", { userId: "new-id" });

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
