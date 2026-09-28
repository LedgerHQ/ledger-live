import { serialiseDerivation } from "./internals/digest.native";
import { checkPassword, clearPasswordIfCorrect, storeNewPassword } from "./check.native";

const SCRYPT = { cost: 16384, blockSize: 8, parallelization: 1, digestLength: 4 };

jest.mock("react-native-fast-crypto", () => ({ scrypt: jest.fn() }));

// Only the derivation is faked: with the queue stubbed out, the ordering tests observe nothing.
jest.mock("./internals/digest.native", () => ({
  ...jest.requireActual("./internals/digest.native"),
  derivePasswordDigest: jest.fn(async (password: string) =>
    password === "right" ? Uint8Array.from([10, 20, 30, 40]) : Uint8Array.from([9, 9, 9, 9]),
  ),
}));

jest.mock("./internals/store.native", () => ({
  readPasswordVerifier: jest.fn(),
  writePasswordVerifier: jest.fn(async () => undefined),
  clearPasswordVerifier: jest.fn(async () => undefined),
}));

const { derivePasswordDigest } = jest.requireMock("./internals/digest.native");
const { readPasswordVerifier, writePasswordVerifier, clearPasswordVerifier } = jest.requireMock(
  "./internals/store.native",
);

const verifier = {
  version: 1,
  scrypt: SCRYPT,
  salt: Uint8Array.from([1, 2, 3, 4]),
  digest: Uint8Array.from([10, 20, 30, 40]),
};

beforeEach(() => jest.clearAllMocks());

describe("checking a password", () => {
  it("accepts the right one and hands back the verifier it matched", async () => {
    readPasswordVerifier.mockResolvedValue(verifier);

    await expect(checkPassword("right")).resolves.toEqual({ status: "correct", verifier });
  });

  it("rejects the wrong one", async () => {
    readPasswordVerifier.mockResolvedValue(verifier);

    await expect(checkPassword("wrong")).resolves.toEqual({ status: "incorrect" });
  });

  it("tells a missing verifier apart from a wrong password", async () => {
    readPasswordVerifier.mockResolvedValue(null);

    await expect(checkPassword("anything")).resolves.toEqual({ status: "notSet" });
    expect(derivePasswordDigest).not.toHaveBeenCalled();
  });

  it("derives with the parameters the verifier carries, not today's defaults", async () => {
    readPasswordVerifier.mockResolvedValue(verifier);

    await checkPassword("right");

    expect(derivePasswordDigest).toHaveBeenCalledWith("right", verifier.salt, verifier.scrypt);
  });

  it("lets a keychain failure through rather than reading as a wrong password", async () => {
    readPasswordVerifier.mockRejectedValue(new Error("keychain unavailable"));

    await expect(checkPassword("right")).rejects.toThrow("keychain unavailable");
  });
});

describe("clearing a password once it is proven", () => {
  it("destroys the verifier when the password is right", async () => {
    readPasswordVerifier.mockResolvedValue(verifier);

    await expect(clearPasswordIfCorrect("right")).resolves.toEqual({
      status: "correct",
      verifier,
    });
    expect(clearPasswordVerifier).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["the password is wrong", () => readPasswordVerifier.mockResolvedValue(verifier), "wrong"],
    ["there is none stored", () => readPasswordVerifier.mockResolvedValue(null), "right"],
  ])("keeps it when %s", async (_case, arrange, password) => {
    arrange();

    await clearPasswordIfCorrect(password);

    expect(clearPasswordVerifier).not.toHaveBeenCalled();
  });

  it("does not let a setup slip between the check and the delete", async () => {
    readPasswordVerifier.mockResolvedValue(verifier);
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
    expect(written.salt).toEqual(salt);
    expect(written.digest).toEqual(Uint8Array.from([10, 20, 30, 40]));
  });

  it("does not let two setups interleave their salts", async () => {
    const order: string[] = [];
    writePasswordVerifier.mockImplementation(async (verifier: { salt: Uint8Array }) => {
      await Promise.resolve();
      order.push(`wrote ${verifier.salt[0]}`);
    });

    await Promise.all([
      storeNewPassword("right", Uint8Array.from([1])),
      storeNewPassword("right", Uint8Array.from([2])),
    ]);

    expect(order).toEqual(["wrote 1", "wrote 2"]);
  });
});
