import { migrateLegacyPassword } from "./migration";

jest.mock("expo-crypto", () => ({
  getRandomBytesAsync: jest.fn(async (length: number) => new Uint8Array(length).fill(7)),
}));

jest.mock("./passwordDigest", () => ({
  APP_LOCK_SALT_LENGTH: 16,
  APP_LOCK_SCRYPT_PARAMS: {
    cost: 16384,
    blockSize: 8,
    parallelization: 1,
    digestLength: 32,
  },
  derivePasswordDigest: jest.fn(async (password: string) =>
    Uint8Array.from(
      Array.from({ length: 32 }, (_, i) => (password.charCodeAt(i % password.length) + i) % 256),
    ),
  ),
  serialiseDerivation: <T>(run: () => Promise<T>) => run(),
}));

const legacy = { password: null as string | null };
const stored = { verifier: null as unknown };

jest.mock("./legacyPassword", () => ({
  readLegacyPassword: jest.fn(async () => legacy.password),
  clearLegacyPassword: jest.fn(async () => {
    legacy.password = null;
  }),
}));

jest.mock("./verifierStore", () => ({
  hasPasswordVerifier: jest.fn(async () => stored.verifier !== null),
  writePasswordVerifier: jest.fn(async (v: unknown) => {
    stored.verifier = v;
  }),
  readPasswordVerifier: jest.fn(async () => stored.verifier),
  clearPasswordVerifier: jest.fn(async () => {
    stored.verifier = null;
  }),
}));

const { clearLegacyPassword } = jest.requireMock("./legacyPassword");
const { writePasswordVerifier } = jest.requireMock("./verifierStore");

beforeEach(() => {
  legacy.password = null;
  stored.verifier = null;
  jest.clearAllMocks();
});

describe("migrateLegacyPassword", () => {
  it("does nothing when there is no legacy password", async () => {
    await expect(migrateLegacyPassword()).resolves.toEqual({ status: "notNeeded" });
    expect(writePasswordVerifier).not.toHaveBeenCalled();
    expect(clearLegacyPassword).not.toHaveBeenCalled();
  });

  it("migrates a compliant password without flagging it", async () => {
    legacy.password = "longenough";

    await expect(migrateLegacyPassword()).resolves.toEqual({
      status: "migrated",
      needsLongerPassword: false,
    });
    expect(stored.verifier).not.toBeNull();
  });

  it("flags a password under the minimum so it can be lengthened", async () => {
    legacy.password = "1234";

    await expect(migrateLegacyPassword()).resolves.toEqual({
      status: "migrated",
      needsLongerPassword: true,
    });
  });

  it("destroys the legacy entry only after the verifier is proven to open", async () => {
    legacy.password = "longenough";
    const order: string[] = [];
    writePasswordVerifier.mockImplementation(async (v: unknown) => {
      order.push("write");
      stored.verifier = v;
    });
    clearLegacyPassword.mockImplementation(async () => {
      order.push("clearLegacy");
      legacy.password = null;
    });

    await migrateLegacyPassword();

    expect(order).toEqual(["write", "clearLegacy"]);
  });

  it("leaves the legacy password intact when the verifier does not open", async () => {
    legacy.password = "longenough";
    stored.verifier = {
      version: 1,
      scrypt: { cost: 1, blockSize: 1, parallelization: 1, digestLength: 32 },
      salt: new Uint8Array(16),
      digest: new Uint8Array(32).fill(1),
    };

    await expect(migrateLegacyPassword()).resolves.toEqual({ status: "deferred" });
    expect(clearLegacyPassword).not.toHaveBeenCalled();
    expect(legacy.password).toBe("longenough");
  });

  it("resumes a run interrupted after the verifier was written", async () => {
    legacy.password = "longenough";
    await migrateLegacyPassword();
    const firstVerifier = stored.verifier;

    legacy.password = "longenough";
    jest.clearAllMocks();

    await expect(migrateLegacyPassword()).resolves.toEqual({
      status: "migrated",
      needsLongerPassword: false,
    });
    expect(writePasswordVerifier).not.toHaveBeenCalled();
    expect(stored.verifier).toBe(firstVerifier);
    expect(legacy.password).toBeNull();
  });

  it("is a no-op once migrated", async () => {
    legacy.password = "longenough";
    await migrateLegacyPassword();

    await expect(migrateLegacyPassword()).resolves.toEqual({ status: "notNeeded" });
  });
});
