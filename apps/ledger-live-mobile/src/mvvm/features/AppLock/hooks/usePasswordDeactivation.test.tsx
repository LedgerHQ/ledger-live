import { PasswordNotSet } from "@features/platform-app-lock";
import { act, renderHook } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { usePasswordDeactivation } from "./usePasswordDeactivation";

const SCRYPT = { cost: 16384, blockSize: 8, parallelization: 1, digestLength: 4 };

jest.mock("../adapters/passwordDigest", () => ({
  derivePasswordDigest: jest.fn(async () => Uint8Array.from([10, 20, 30, 40])),
  serialiseDerivation: <T,>(run: () => Promise<T>) => run(),
}));

jest.mock("../adapters/verifierStore", () => ({
  readPasswordVerifier: jest.fn(),
  clearPasswordVerifier: jest.fn(async () => undefined),
}));

const { derivePasswordDigest } = jest.requireMock("../adapters/passwordDigest");
const { readPasswordVerifier, clearPasswordVerifier } = jest.requireMock(
  "../adapters/verifierStore",
);

const storedVerifier = {
  version: 1,
  scrypt: SCRYPT,
  salt: Uint8Array.from([1, 2, 3, 4]),
  digest: Uint8Array.from([10, 20, 30, 40]),
};

const protectedState = (state: State): State => ({
  ...state,
  appLock: { ...state.appLock, hasPassword: true },
});

const renderDeactivation = () =>
  renderHook(() => usePasswordDeactivation(), { overrideInitialState: protectedState });

beforeEach(() => jest.clearAllMocks());

describe("deactivating the password", () => {
  it("destroys the verifier once the password is proven", async () => {
    readPasswordVerifier.mockResolvedValue(storedVerifier);

    const { store, result } = renderDeactivation();

    await act(async () => {
      await expect(result.current.deactivatePassword("longenough")).resolves.toBe(true);
    });

    expect(clearPasswordVerifier).toHaveBeenCalledTimes(1);
    expect(store.getState().appLock.hasPassword).toBe(false);
  });

  it("derives with the parameters the verifier was created with", async () => {
    readPasswordVerifier.mockResolvedValue(storedVerifier);

    const { result } = renderDeactivation();

    await act(async () => {
      await result.current.deactivatePassword("longenough");
    });

    // Today's defaults would give a different digest and lock out anyone who set a password
    // before they changed.
    expect(derivePasswordDigest).toHaveBeenCalledWith(
      "longenough",
      storedVerifier.salt,
      storedVerifier.scrypt,
    );
  });

  it("keeps the verifier when the password is wrong", async () => {
    readPasswordVerifier.mockResolvedValue({
      ...storedVerifier,
      digest: Uint8Array.from([99, 99, 99, 99]),
    });

    const { store, result } = renderDeactivation();

    await act(async () => {
      await expect(result.current.deactivatePassword("wrong")).resolves.toBe(false);
    });

    expect(clearPasswordVerifier).not.toHaveBeenCalled();
    expect(store.getState().appLock.hasPassword).toBe(true);
  });

  it("raises rather than reporting a wrong password when there is none to check", async () => {
    readPasswordVerifier.mockResolvedValue(null);

    const { result } = renderDeactivation();

    await act(async () => {
      await expect(result.current.deactivatePassword("anything")).rejects.toBeInstanceOf(
        PasswordNotSet,
      );
    });

    expect(clearPasswordVerifier).not.toHaveBeenCalled();
  });
});
