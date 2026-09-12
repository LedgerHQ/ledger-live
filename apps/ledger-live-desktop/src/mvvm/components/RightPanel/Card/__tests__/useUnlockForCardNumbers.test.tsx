import React, { type PropsWithChildren } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { act, renderHook } from "@testing-library/react";
import { isEncryptionKeyCorrect, setEncryptionKey } from "~/renderer/storage";
import { useUnlockForCardNumbers } from "../useUnlockForCardNumbers";

jest.mock("LLD/hooks/redux", () => jest.requireActual("react-redux"));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        "payTab.card.numbers.passwordRequired": "Password required",
        "payTab.card.numbers.passwordMismatch": "Passwords don't match",
        "payTab.card.numbers.passwordIncorrect": "Incorrect password",
        "payTab.card.numbers.passwordCreateFailed": "Couldn't set your password",
        "payTab.card.numbers.passwordUnavailable": "Couldn't check your password",
      })[key] ?? key,
  }),
}));

jest.mock("~/renderer/storage", () => ({
  setEncryptionKey: jest.fn(),
  isEncryptionKeyCorrect: jest.fn(),
}));

function applicationReducer(
  state = { hasPassword: false },
  action: { type: string; payload?: { hasPassword?: boolean } },
) {
  if (action.type === "APPLICATION_SET_DATA" && action.payload) {
    return { ...state, ...action.payload };
  }
  return state;
}

function renderUnlock(hasPassword: boolean) {
  const store = configureStore({
    reducer: { application: applicationReducer },
    preloadedState: { application: { hasPassword } },
  });

  function Wrapper({ children }: PropsWithChildren) {
    return <Provider store={store}>{children}</Provider>;
  }

  return {
    store,
    ...renderHook(() => useUnlockForCardNumbers(), { wrapper: Wrapper }),
  };
}

describe("useUnlockForCardNumbers", () => {
  const setEncryptionKeyMock = jest.mocked(setEncryptionKey);
  const isEncryptionKeyCorrectMock = jest.mocked(isEncryptionKeyCorrect);

  beforeEach(() => {
    setEncryptionKeyMock.mockResolvedValue(undefined);
    isEncryptionKeyCorrectMock.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should open the set-password dialog when there is no password", async () => {
    const { result } = renderUnlock(false);

    let unlocked: Promise<boolean> | undefined;
    act(() => {
      unlocked = result.current.unlock();
    });

    expect(result.current.dialog.isOpen).toBe(true);
    expect(result.current.dialog.mode).toBe("create");

    act(() => {
      result.current.dialog.onCancel();
    });

    await expect(unlocked).resolves.toBe(false);
    expect(result.current.dialog.isOpen).toBe(false);
  });

  it("should open the enter-password dialog when there is a password", async () => {
    const { result } = renderUnlock(true);

    let unlocked: Promise<boolean> | undefined;
    act(() => {
      unlocked = result.current.unlock();
    });

    expect(result.current.dialog.mode).toBe("verify");

    act(() => {
      result.current.dialog.onCancel();
    });

    await expect(unlocked).resolves.toBe(false);
  });

  it("should save the password and succeed", async () => {
    const { result, store } = renderUnlock(false);

    let unlocked: Promise<boolean> | undefined;
    act(() => {
      unlocked = result.current.unlock();
    });

    await act(async () => {
      result.current.dialog.onSubmit("secret", "secret");
    });

    expect(setEncryptionKeyMock).toHaveBeenCalledWith("secret");
    expect(store.getState().application.hasPassword).toBe(true);
    await expect(unlocked).resolves.toBe(true);
    expect(result.current.dialog.isOpen).toBe(false);
  });

  it("should show a required error when the password is empty", async () => {
    const { result } = renderUnlock(false);

    act(() => {
      void result.current.unlock();
    });

    await act(async () => {
      result.current.dialog.onSubmit("", "");
    });

    expect(setEncryptionKeyMock).not.toHaveBeenCalled();
    expect(result.current.dialog.error).toBe("Password required");
    expect(result.current.dialog.isOpen).toBe(true);
  });

  it("should show an error when the two passwords are not the same", async () => {
    const { result } = renderUnlock(false);

    act(() => {
      void result.current.unlock();
    });

    await act(async () => {
      result.current.dialog.onSubmit("secret", "other");
    });

    expect(setEncryptionKeyMock).not.toHaveBeenCalled();
    expect(result.current.dialog.error).toBe("Passwords don't match");
    expect(result.current.dialog.isOpen).toBe(true);
  });

  it("should show a required error when verify password is empty", async () => {
    const { result } = renderUnlock(true);

    act(() => {
      void result.current.unlock();
    });

    await act(async () => {
      result.current.dialog.onSubmit("", "");
    });

    expect(isEncryptionKeyCorrectMock).not.toHaveBeenCalled();
    expect(result.current.dialog.error).toBe("Password required");
    expect(result.current.dialog.isOpen).toBe(true);
  });

  it("should accept the current password", async () => {
    const { result } = renderUnlock(true);

    let unlocked: Promise<boolean> | undefined;
    act(() => {
      unlocked = result.current.unlock();
    });

    await act(async () => {
      result.current.dialog.onSubmit("secret", "");
    });

    expect(isEncryptionKeyCorrectMock).toHaveBeenCalledWith("secret");
    await expect(unlocked).resolves.toBe(true);
  });

  it("should show an error when the password is wrong", async () => {
    isEncryptionKeyCorrectMock.mockResolvedValue(false);
    const { result } = renderUnlock(true);

    act(() => {
      void result.current.unlock();
    });

    await act(async () => {
      result.current.dialog.onSubmit("wrong", "");
    });

    expect(result.current.dialog.error).toBe("Incorrect password");
    expect(result.current.dialog.isOpen).toBe(true);
  });

  it("should keep the error on screen while the user tries again", async () => {
    let resolveRetry: ((ok: boolean) => void) | undefined;
    isEncryptionKeyCorrectMock.mockResolvedValueOnce(false).mockImplementation(
      () =>
        new Promise(resolve => {
          resolveRetry = resolve;
        }),
    );
    const { result } = renderUnlock(true);

    act(() => {
      void result.current.unlock();
    });

    await act(async () => {
      result.current.dialog.onSubmit("wrong", "");
    });
    expect(result.current.dialog.error).toBe("Incorrect password");

    jest.useFakeTimers();
    act(() => {
      result.current.dialog.onSubmit("wrong", "");
    });

    expect(result.current.dialog.isSubmitting).toBe(false);
    expect(result.current.dialog.error).toBe("Incorrect password");

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current.dialog.isSubmitting).toBe(true);
    expect(result.current.dialog.error).toBe("Incorrect password");

    await act(async () => {
      resolveRetry?.(false);
    });

    expect(result.current.dialog.isSubmitting).toBe(false);
  });

  it("should ignore cancel while the password is being saved", async () => {
    let resolveSave: (() => void) | undefined;
    setEncryptionKeyMock.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveSave = () => resolve(undefined);
        }),
    );
    const { result } = renderUnlock(false);

    let unlocked: Promise<boolean> | undefined;
    act(() => {
      unlocked = result.current.unlock();
    });

    act(() => {
      void result.current.dialog.onSubmit("secret", "secret");
    });
    expect(result.current.dialog.isBusy).toBe(true);

    act(() => {
      result.current.dialog.onCancel();
    });
    expect(result.current.dialog.isOpen).toBe(true);

    await act(async () => {
      resolveSave?.();
    });

    await expect(unlocked).resolves.toBe(true);
    expect(result.current.dialog.isOpen).toBe(false);
  });

  it("should show a create error when setting the password fails", async () => {
    setEncryptionKeyMock.mockRejectedValue(new Error("ipc"));
    const { result } = renderUnlock(false);

    act(() => {
      void result.current.unlock();
    });

    await act(async () => {
      result.current.dialog.onSubmit("secret", "secret");
    });

    expect(result.current.dialog.error).toBe("Couldn't set your password");
    expect(result.current.dialog.isOpen).toBe(true);
  });

  it("should show a generic error when the password check fails", async () => {
    isEncryptionKeyCorrectMock.mockRejectedValue(new Error("ipc"));
    const { result } = renderUnlock(true);

    act(() => {
      void result.current.unlock();
    });

    await act(async () => {
      result.current.dialog.onSubmit("secret", "");
    });

    expect(result.current.dialog.error).toBe("Couldn't check your password");
    expect(result.current.dialog.isOpen).toBe(true);
  });

  it("should fail unlock when the panel unmounts", async () => {
    const { result, unmount } = renderUnlock(false);

    let unlocked: Promise<boolean> | undefined;
    act(() => {
      unlocked = result.current.unlock();
    });

    unmount();

    await expect(unlocked).resolves.toBe(false);
  });

  it("should not flip loading on after the panel unmounts during save", async () => {
    let resolveSave: (() => void) | undefined;
    setEncryptionKeyMock.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveSave = () => resolve(undefined);
        }),
    );
    const { result, unmount } = renderUnlock(false);

    let unlocked: Promise<boolean> | undefined;
    act(() => {
      unlocked = result.current.unlock();
    });

    jest.useFakeTimers();
    act(() => {
      void result.current.dialog.onSubmit("secret", "secret");
    });

    unmount();

    await expect(unlocked).resolves.toBe(false);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await act(async () => {
      resolveSave?.();
    });
  });
});
