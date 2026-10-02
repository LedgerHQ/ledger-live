import { act, renderHook } from "@testing-library/react-native";
import { useLongerPasswordViewModel } from "./viewModel";

type SavePassword = jest.Mock<Promise<undefined>, [string]>;

const savePasswordStub = (): SavePassword => jest.fn<Promise<undefined>, [string]>();

const renderViewModel = (savePassword: SavePassword = savePasswordStub()) => {
  const { result } = renderHook(() => useLongerPasswordViewModel({ savePassword }));

  return { result, savePassword };
};

describe("requiring a longer password", () => {
  it("opens on the prompt, which is the only way in", () => {
    const { result } = renderViewModel();

    expect(result.current.step).toBe("prompt");
  });

  it("walks the prompt, the new password and its confirmation in order", async () => {
    const { result, savePassword } = renderViewModel();

    act(() => result.current.onChangeRequested());
    act(() => result.current.onPromptHidden());
    expect(result.current.step).toBe("enter");

    act(() => result.current.onEntered());
    expect(result.current.step).toBe("confirm");

    await act(() => result.current.onConfirmed("longenough"));

    expect(savePassword).toHaveBeenCalledWith("longenough");
    expect(result.current.step).toBe("done");
  });

  // Closing a sheet retracts the keyboard globally, so a field mounted before the prompt has gone
  // loses the keyboard it just raised.
  it("holds the field back until the prompt has left the screen", () => {
    const { result } = renderViewModel();

    act(() => result.current.onChangeRequested());

    expect(result.current.step).toBe("closing");

    act(() => result.current.onPromptHidden());

    expect(result.current.step).toBe("enter");
  });

  // The sheet gives its own dismissal 600ms, and retracts the keyboard as it lands.
  it("carries on when the sheet never reports that it went, but not before it has given up", () => {
    jest.useFakeTimers();

    try {
      const { result } = renderViewModel();

      act(() => result.current.onChangeRequested());

      act(() => jest.advanceTimersByTime(600));
      expect(result.current.step).toBe("closing");

      act(() => jest.advanceTimersByTime(200));
      expect(result.current.step).toBe("enter");
    } finally {
      jest.useRealTimers();
    }
  });

  it("ignores a late report from a prompt the flow has already moved past", () => {
    const { result } = renderViewModel();

    act(() => result.current.onChangeRequested());
    act(() => result.current.onPromptHidden());
    act(() => result.current.onEntered());

    act(() => result.current.onPromptHidden());

    expect(result.current.step).toBe("confirm");
  });

  it("holds the confirmation when the password cannot be stored", async () => {
    const savePassword = savePasswordStub().mockRejectedValue(new Error("keychain unavailable"));
    const { result } = renderViewModel(savePassword);

    act(() => result.current.onChangeRequested());
    act(() => result.current.onPromptHidden());
    act(() => result.current.onEntered());
    await act(() => result.current.onConfirmed("longenough"));

    expect(result.current.step).toBe("confirm");
    expect(result.current.hasSaveFailed).toBe(true);
  });

  it("clears the failure when the next attempt starts", async () => {
    const savePassword = savePasswordStub()
      .mockRejectedValueOnce(new Error("keychain unavailable"))
      .mockResolvedValueOnce(undefined);
    const { result } = renderViewModel(savePassword);

    await act(() => result.current.onConfirmed("longenough"));
    await act(() => result.current.onConfirmed("longenough"));

    expect(result.current.hasSaveFailed).toBe(false);
    expect(result.current.step).toBe("done");
  });

  it("returns to the start once the change is acknowledged", async () => {
    const { result } = renderViewModel();

    act(() => result.current.onChangeRequested());
    act(() => result.current.onPromptHidden());
    act(() => result.current.onEntered());
    await act(() => result.current.onConfirmed("longenough"));

    expect(result.current.step).toBe("done");

    act(() => result.current.onDone());

    expect(result.current.step).toBe("prompt");
  });
});
