import { act, renderHook } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import useUnlockScreenViewModel from "./useUnlockScreenViewModel";

jest.mock("@features/platform-app-lock", () => ({
  ...jest.requireActual("@features/platform-app-lock"),
  promptBiometrics: jest.fn(async () => ({ status: "failed" })),
  checkPassword: jest.fn(async () => ({ status: "incorrect" })),
}));

const lockedWithPassword = (state: State) => ({
  ...state,
  appLock: { ...state.appLock, isHydrated: true, isLocked: true, hasPassword: true },
});

const renderViewModel = () =>
  renderHook(() => useUnlockScreenViewModel(), { overrideInitialState: lockedWithPassword });

describe("the unlock screen's forgot-password sheet", () => {
  it("is closed until the link asks for it", async () => {
    const { result } = renderViewModel();

    expect(result.current.isForgotPasswordOpen).toBe(false);

    await act(async () => {
      result.current.onForgotPassword?.();
    });

    expect(result.current.isForgotPasswordOpen).toBe(true);
  });

  it("closes when the sheet asks to", async () => {
    const { result } = renderViewModel();

    await act(async () => {
      result.current.onForgotPassword?.();
    });
    await act(async () => {
      result.current.onForgotPasswordClose();
    });

    expect(result.current.isForgotPasswordOpen).toBe(false);
  });
});
