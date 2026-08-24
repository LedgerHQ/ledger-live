import { PasswordNotSet } from "@features/platform-app-lock";
import { act, renderHook } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { usePasswordDeactivation } from "./usePasswordDeactivation";

jest.mock("../adapters/passwordVerification", () => ({
  checkPassword: jest.fn(),
}));

jest.mock("../adapters/verifierStore", () => ({
  clearPasswordVerifier: jest.fn(async () => undefined),
}));

const { checkPassword } = jest.requireMock("../adapters/passwordVerification");
const { clearPasswordVerifier } = jest.requireMock("../adapters/verifierStore");

const protectedState = (state: State): State => ({
  ...state,
  appLock: { ...state.appLock, hasPassword: true },
});

beforeEach(() => jest.clearAllMocks());

describe("deactivating the password", () => {
  it("destroys the verifier once the password is proven", async () => {
    checkPassword.mockResolvedValue({ status: "correct", verifier: { version: 1 } });

    const { store, result } = renderHook(() => usePasswordDeactivation(), {
      overrideInitialState: protectedState,
    });

    await act(async () => {
      await expect(result.current.deactivatePassword("longenough")).resolves.toBe(true);
    });

    expect(clearPasswordVerifier).toHaveBeenCalledTimes(1);
    expect(store.getState().appLock.hasPassword).toBe(false);
  });

  it("keeps the verifier when the password is wrong", async () => {
    checkPassword.mockResolvedValue({ status: "incorrect" });

    const { store, result } = renderHook(() => usePasswordDeactivation(), {
      overrideInitialState: protectedState,
    });

    await act(async () => {
      await expect(result.current.deactivatePassword("wrong")).resolves.toBe(false);
    });

    expect(clearPasswordVerifier).not.toHaveBeenCalled();
    expect(store.getState().appLock.hasPassword).toBe(true);
  });

  it("raises rather than reporting a wrong password when there is none to check", async () => {
    checkPassword.mockResolvedValue({ status: "notSet" });

    const { result } = renderHook(() => usePasswordDeactivation(), {
      overrideInitialState: protectedState,
    });

    await act(async () => {
      await expect(result.current.deactivatePassword("anything")).rejects.toBeInstanceOf(
        PasswordNotSet,
      );
    });

    expect(clearPasswordVerifier).not.toHaveBeenCalled();
  });
});
