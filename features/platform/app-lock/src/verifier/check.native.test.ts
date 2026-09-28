import { serialiseDerivation } from "./internals/digest.native";
import {
  checkPassword,
  clearPasswordIfCorrect,
  needsLongerStoredPassword,
  storeNewPassword,
} from "./check.native";

const SCRYPT = { cost: 16384, blockSize: 8, parallelization: 1, digestLength: 4 };

jest.mock("react-native-fast-crypto", () => ({ scrypt: jest.fn() }));

// Only the derivation is faked: with the queue stubbed out, the ordering tests observe nothing.
jest.mock("./internals/digest.native", () => ({
  ...jest.requireActual("./internals/digest.native"),
  // "right" and "rightlong" both open the verifier; only the second is long enough to keep.
  derivePasswordDigest: jest.fn(async (password: string) =>
    password.startsWith("right")
      ? Uint8Array.from([10, 20, 30, 40])
      : Uint8Array.from([9, 9, 9, 9]),
  ),
}));

jest.mock("./internals/store.native", () => ({
  readStoredPassword: jest.fn(),
  writePasswordVerifier: jest.fn(async () => undefined),
  clearPasswordVerifier: jest.fn(async () => undefined),
}));

const { derivePasswordDigest } = jest.requireMock("./internals/digest.native");
const { readStoredPassword, writePasswordVerifier, clearPasswordVerifier } = jest.requireMock(
  "./internals/store.native",
);

const verifier = {
  version: 1,
  scrypt: SCRYPT,
  salt: Uint8Array.from([1, 2, 3, 4]),
  digest: Uint8Array.from([10, 20, 30, 40]),
};

const storedAs = (needsLongerPassword: boolean) => ({ verifier, needsLongerPassword });

beforeEach(() => jest.clearAllMocks());

describe("checking a password", () => {
  it("accepts the right one and hands back the verifier it matched", async () => {
    readStoredPassword.mockResolvedValue(storedAs(false));

    await expect(checkPassword("rightlong")).resolves.toEqual({
      status: "correct",
      verifier,
      needsLongerPassword: false,
    });
  });

  it("rejects the wrong one", async () => {
    readStoredPassword.mockResolvedValue(storedAs(false));

    await expect(checkPassword("wrong")).resolves.toEqual({ status: "incorrect" });
  });

  it("tells a missing verifier apart from a wrong password", async () => {
    readStoredPassword.mockResolvedValue(null);

    await expect(checkPassword("anything")).resolves.toEqual({ status: "notSet" });
    expect(derivePasswordDigest).not.toHaveBeenCalled();
  });

  it("derives with the parameters the verifier carries, not today's defaults", async () => {
    readStoredPassword.mockResolvedValue(storedAs(false));

    await checkPassword("right");

    expect(derivePasswordDigest).toHaveBeenCalledWith("right", verifier.salt, verifier.scrypt);
  });

  it("lets a keychain failure through rather than reading as a wrong password", async () => {
    readStoredPassword.mockRejectedValue(new Error("keychain unavailable"));

    await expect(checkPassword("right")).rejects.toThrow("keychain unavailable");
  });
});

describe("what an unlock learns about the password's length", () => {
  it.each([
    ["a record claiming nothing is owed, unlocked with a short password", false, "right", true],
    ["a record claiming one is owed, unlocked with a long password", true, "rightlong", false],
  ])("reports the password over %s", async (_case, marked, password, expected) => {
    readStoredPassword.mockResolvedValue(storedAs(marked));

    await expect(checkPassword(password)).resolves.toMatchObject({
      needsLongerPassword: expected,
    });
  });

  it("writes the correction back, so the next biometric unlock agrees", async () => {
    readStoredPassword.mockResolvedValue(storedAs(false));

    await checkPassword("right");

    expect(writePasswordVerifier).toHaveBeenCalledWith({ verifier, needsLongerPassword: true });
  });

  it.each([
    ["the record already agrees", true, "right"],
    ["the password does not open it", false, "wrong"],
  ])("writes nothing when %s", async (_case, marked, password) => {
    readStoredPassword.mockResolvedValue(storedAs(marked));

    await checkPassword(password);

    expect(writePasswordVerifier).not.toHaveBeenCalled();
  });

  it("still unlocks when the correction cannot be stored", async () => {
    readStoredPassword.mockResolvedValue(storedAs(false));
    writePasswordVerifier.mockRejectedValueOnce(new Error("keychain unavailable"));

    await expect(checkPassword("right")).resolves.toEqual({
      status: "correct",
      verifier,
      needsLongerPassword: true,
    });
  });
});

describe("reading the mark without a password", () => {
  it.each([
    ["what a marked record says", true, true],
    ["what an unmarked one says", false, false],
    ["nothing when there is no record", null, false],
  ])("reports %s", async (_case, marked, expected) => {
    readStoredPassword.mockResolvedValue(marked === null ? null : storedAs(marked));

    await expect(needsLongerStoredPassword()).resolves.toBe(expected);
  });
});

describe("clearing a password once it is proven", () => {
  it("destroys the verifier when the password is right", async () => {
    readStoredPassword.mockResolvedValue(storedAs(false));

    await expect(clearPasswordIfCorrect("right")).resolves.toMatchObject({
      status: "correct",
      verifier,
    });
    expect(clearPasswordVerifier).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["the password is wrong", () => readStoredPassword.mockResolvedValue(storedAs(false)), "wrong"],
    ["there is none stored", () => readStoredPassword.mockResolvedValue(null), "right"],
  ])("keeps it when %s", async (_case, arrange, password) => {
    arrange();

    await clearPasswordIfCorrect(password);

    expect(clearPasswordVerifier).not.toHaveBeenCalled();
  });

  it("does not let a setup slip between the check and the delete", async () => {
    readStoredPassword.mockResolvedValue(storedAs(false));
    const order: string[] = [];
    // Without a tick the race is decided by microtask order and this passes either way.
    clearPasswordVerifier.mockImplementation(async () => {
      await Promise.resolve();
      order.push("cleared");
    });

    const clearing = clearPasswordIfCorrect("right");
    const setup = serialiseDerivation(async () => {
      order.push("stored a new verifier");
    });

    await Promise.all([clearing, setup]);

    expect(order).toEqual(["cleared", "stored a new verifier"]);
  });
});

describe("storing a new password", () => {
  it("writes a verifier built from the digest and the salt it was given", async () => {
    const salt = Uint8Array.from([1, 2, 3, 4]);

    await storeNewPassword("right", salt);

    expect(derivePasswordDigest).toHaveBeenCalledWith("right", salt, expect.any(Object));
    expect(writePasswordVerifier).toHaveBeenCalledTimes(1);
    const [written] = writePasswordVerifier.mock.calls[0];
    // Equality, not identity: createPasswordVerifier copies the bytes it is handed.
    expect(written.verifier.salt).toEqual(salt);
    expect(written.verifier.digest).toEqual(Uint8Array.from([10, 20, 30, 40]));
  });

  it.each([
    ["under the minimum", "short", true],
    ["at or above it", "longenough", false],
  ])("records a password %s beside the verifier it wrote", async (_case, password, expected) => {
    await storeNewPassword(password, Uint8Array.from([1, 2, 3, 4]));

    const [written] = writePasswordVerifier.mock.calls[0];
    expect(written.needsLongerPassword).toBe(expected);
  });

  it("does not let two setups interleave their salts", async () => {
    const order: string[] = [];
    writePasswordVerifier.mockImplementation(
      async (written: { verifier: { salt: Uint8Array } }) => {
        await Promise.resolve();
        order.push(`wrote ${written.verifier.salt[0]}`);
      },
    );

    await Promise.all([
      storeNewPassword("right", Uint8Array.from([1])),
      storeNewPassword("right", Uint8Array.from([2])),
    ]);

    expect(order).toEqual(["wrote 1", "wrote 2"]);
  });
});
