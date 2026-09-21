import { checkPassword } from "./check.native";
import { isLegacyMigrationComplete, migrateLegacyPassword } from "./migration.native";

const SCRYPT = { cost: 16384, blockSize: 8, parallelization: 1, digestLength: 4 };
const SALT = Uint8Array.from([1, 2, 3, 4]);

jest.mock("react-native-fast-crypto", () => ({ scrypt: jest.fn() }));

// The real queue, as in check.native.test.ts: stubbing it out is what let the deadlock below ship.
jest.mock("./internals/digest.native", () => ({
  ...jest.requireActual("./internals/digest.native"),
  APP_LOCK_SCRYPT_PARAMS: { cost: 16384, blockSize: 8, parallelization: 1, digestLength: 4 },
  derivePasswordDigest: jest.fn(async (password: string) =>
    Uint8Array.from([password.length, 20, 30, 40]),
  ),
}));

const legacy = { password: null as string | null };
const stored = { verifier: null as unknown };

jest.mock("./internals/legacyPassword.native", () => ({
  readLegacyPassword: jest.fn(async () => legacy.password),
  hasLegacyPassword: jest.fn(async () => legacy.password !== null),
  clearLegacyPassword: jest.fn(async () => {
    legacy.password = null;
    return true;
  }),
}));

jest.mock("./internals/store.native", () => ({
  hasStoredVerifier: jest.fn(async () => stored.verifier !== null),
  readPasswordVerifier: jest.fn(async () => stored.verifier),
  writePasswordVerifier: jest.fn(async (verifier: unknown) => {
    stored.verifier = verifier;
  }),
  clearPasswordVerifier: jest.fn(async () => {
    stored.verifier = null;
  }),
}));

const { clearLegacyPassword } = jest.requireMock("./internals/legacyPassword.native");
const { writePasswordVerifier } = jest.requireMock("./internals/store.native");

beforeEach(() => {
  legacy.password = null;
  stored.verifier = null;
  jest.clearAllMocks();
});

describe("migrating a legacy password", () => {
  it("does nothing when there is none", async () => {
    await expect(migrateLegacyPassword(SALT, "ios")).resolves.toEqual({ status: "notNeeded" });
    expect(writePasswordVerifier).not.toHaveBeenCalled();
    expect(clearLegacyPassword).not.toHaveBeenCalled();
  });

  it("moves a compliant password without flagging it", async () => {
    legacy.password = "longenough";

    await expect(migrateLegacyPassword(SALT, "ios")).resolves.toEqual({
      status: "migrated",
      needsLongerPassword: false,
    });
    expect(stored.verifier).not.toBeNull();
    expect(legacy.password).toBeNull();
  });

  it("flags one under the minimum, which nothing could tell afterwards", async () => {
    legacy.password = "1234";

    await expect(migrateLegacyPassword(SALT, "ios")).resolves.toEqual({
      status: "migrated",
      needsLongerPassword: true,
    });
  });

  it("destroys the legacy entry only once the verifier is proven to open", async () => {
    legacy.password = "longenough";
    const order: string[] = [];

    writePasswordVerifier.mockImplementation(async (verifier: unknown) => {
      order.push("write");
      stored.verifier = verifier;
    });
    clearLegacyPassword.mockImplementation(async () => {
      order.push("clearLegacy");
      legacy.password = null;
      return true;
    });

    await migrateLegacyPassword(SALT, "ios");

    expect(order).toEqual(["write", "clearLegacy"]);
  });

  it("replaces a stored verifier the proven password will not open, rather than giving up", async () => {
    legacy.password = "longenough";
    stored.verifier = {
      version: 1,
      scrypt: SCRYPT,
      salt: SALT,
      digest: Uint8Array.from([99, 99, 99, 99]),
    };

    await expect(migrateLegacyPassword(SALT, "ios")).resolves.toEqual({
      status: "migrated",
      needsLongerPassword: false,
    });

    expect(writePasswordVerifier).toHaveBeenCalledTimes(1);
    await expect(checkPassword("longenough")).resolves.toMatchObject({ status: "correct" });
    expect(clearLegacyPassword).toHaveBeenCalled();
  });

  it("keeps the legacy entry when the written verifier still will not open", async () => {
    legacy.password = "longenough";
    writePasswordVerifier.mockImplementationOnce(async () => {
      stored.verifier = {
        version: 1,
        scrypt: SCRYPT,
        salt: SALT,
        digest: Uint8Array.from([99, 99, 99, 99]),
      };
    });

    await expect(migrateLegacyPassword(SALT, "ios")).resolves.toEqual({ status: "deferred" });
    expect(clearLegacyPassword).not.toHaveBeenCalled();
    expect(legacy.password).toBe("longenough");
  });

  it("does not report a migration the keychain refused to finish", async () => {
    legacy.password = "longenough";
    clearLegacyPassword.mockImplementationOnce(async () => false);

    await expect(migrateLegacyPassword(SALT, "ios")).resolves.toEqual({ status: "deferred" });
    expect(legacy.password).toBe("longenough");
  });

  it("does not report one the keychain refused on the resuming path either", async () => {
    legacy.password = "longenough";
    await migrateLegacyPassword(SALT, "ios");

    legacy.password = "longenough";
    clearLegacyPassword.mockImplementationOnce(async () => false);

    await expect(migrateLegacyPassword(SALT, "ios")).resolves.toEqual({ status: "deferred" });
    expect(legacy.password).toBe("longenough");
  });

  it("finishes a run interrupted after the write instead of deriving again", async () => {
    legacy.password = "longenough";
    await migrateLegacyPassword(SALT, "ios");
    const firstVerifier = stored.verifier;

    legacy.password = "longenough";
    jest.clearAllMocks();

    await expect(migrateLegacyPassword(SALT, "ios")).resolves.toEqual({
      status: "migrated",
      needsLongerPassword: false,
    });
    expect(writePasswordVerifier).not.toHaveBeenCalled();
    expect(stored.verifier).toBe(firstVerifier);
    expect(legacy.password).toBeNull();
  });

  it("is a no-op once migrated", async () => {
    legacy.password = "longenough";
    await migrateLegacyPassword(SALT, "ios");

    await expect(migrateLegacyPassword(SALT, "ios")).resolves.toEqual({ status: "notNeeded" });
  });

  it("takes a single turn of the queue, so nothing waits on a turn it is already inside", async () => {
    legacy.password = "longenough";

    const hung = Symbol("hung");
    const afterManyTicks = async () => {
      for (let tick = 0; tick < 100; tick++) {
        await Promise.resolve();
      }
      return hung;
    };

    const settled = await Promise.race([migrateLegacyPassword(SALT, "ios"), afterManyTicks()]);

    expect(settled).not.toBe(hung);
    await expect(checkPassword("longenough")).resolves.toMatchObject({ status: "correct" });
  });
});

describe("telling whether an earlier run finished", () => {
  it("is complete once the legacy entry is gone and a verifier stands in its place", async () => {
    legacy.password = "longenough";
    await migrateLegacyPassword(SALT, "ios");

    await expect(isLegacyMigrationComplete()).resolves.toBe(true);
  });

  it("is not complete while the legacy entry is still there", async () => {
    legacy.password = "longenough";

    await expect(isLegacyMigrationComplete()).resolves.toBe(false);
  });

  it("is not complete for a user who never had a verifier", async () => {
    await expect(isLegacyMigrationComplete()).resolves.toBe(false);
  });
});
