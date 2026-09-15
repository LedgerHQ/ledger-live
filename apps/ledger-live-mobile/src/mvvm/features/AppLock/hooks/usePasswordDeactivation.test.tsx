import { PasswordNotSet } from "@features/platform-app-lock";
import { act, renderHook } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { usePasswordDeactivation } from "./usePasswordDeactivation";

jest.mock("@features/platform-app-lock", () => ({
  ...jest.requireActual("@features/platform-app-lock"),
  clearPasswordIfCorrect: jest.fn(),
}));

const { clearPasswordIfCorrect } = jest.requireMock("@features/platform-app-lock");

const protectedState = (state: State): State => ({
  ...state,
  appLock: { ...state.appLock, hasPassword: true },
});

const renderDeactivation = () =>
  renderHook(() => usePasswordDeactivation(), { overrideInitialState: protectedState });

beforeEach(() => jest.clearAllMocks());

describe("deactivating the password", () => {
  it("drops the protection once the password is proven", async () => {
    clearPasswordIfCorrect.mockResolvedValue({ status: "correct", verifier: { version: 1 } });

    const { store, result } = renderDeactivation();

    await act(async () => {
      await expect(result.current.deactivatePassword("longenough")).resolves.toBe(true);
    });

    expect(clearPasswordIfCorrect).toHaveBeenCalledWith("longenough");
    expect(store.getState().appLock.hasPassword).toBe(false);
  });

  it("keeps the protection when the password is wrong", async () => {
    clearPasswordIfCorrect.mockResolvedValue({ status: "incorrect" });

    const { store, result } = renderDeactivation();

    await act(async () => {
      await expect(result.current.deactivatePassword("wrong")).resolves.toBe(false);
    });

    expect(store.getState().appLock.hasPassword).toBe(true);
  });

  it("raises rather than reporting a wrong password when there is none to check", async () => {
    clearPasswordIfCorrect.mockResolvedValue({ status: "notSet" });

    const { store, result } = renderDeactivation();

    await act(async () => {
      await expect(result.current.deactivatePassword("anything")).rejects.toBeInstanceOf(
        PasswordNotSet,
      );
    });

    expect(store.getState().appLock.hasPassword).toBe(true);
  });
});
