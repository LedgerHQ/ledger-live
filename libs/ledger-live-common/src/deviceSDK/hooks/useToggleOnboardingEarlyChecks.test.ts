import { renderHook, act } from "@testing-library/react-hooks";
import {
  UseToggleOnboardingEarlyCheckArgs,
  useToggleOnboardingEarlyCheck,
} from "./useToggleOnboardingEarlyChecks";
import { of } from "rxjs";
import { delay } from "rxjs/operators";

jest.useFakeTimers();

const mockedToggleOnboardingEarlyCheckAction = jest.fn();

describe("useToggleOnboardingEarlyCheck", () => {
  beforeEach(() => {
    mockedToggleOnboardingEarlyCheckAction.mockClear();
  });

  it("should return a success state when the toggle action is successful", async () => {
    mockedToggleOnboardingEarlyCheckAction.mockReturnValue(
      of({ toggleStatus: "success" })
    );
    const { result } = renderHook(() =>
      useToggleOnboardingEarlyCheck({
        toggleOnboardingEarlyCheckAction:
          mockedToggleOnboardingEarlyCheckAction,
        deviceId: "",
        toggleType: "enter",
      })
    );

    await act(async () => {
      jest.advanceTimersByTime(1);
    });

    expect(result.current.state).toEqual({
      toggleStatus: "success",
    });
  });

  it("should return a state initialized and reset at null when successively triggering the hook", async () => {
    const delayMs = 1000;
    mockedToggleOnboardingEarlyCheckAction.mockReturnValue(
      of({ toggleStatus: "success" }).pipe(delay(delayMs))
    );

    // Step 1: enter
    let toggleType: UseToggleOnboardingEarlyCheckArgs["toggleType"] = "enter";

    const { result, rerender } = renderHook(() =>
      useToggleOnboardingEarlyCheck({
        toggleOnboardingEarlyCheckAction:
          mockedToggleOnboardingEarlyCheckAction,
        deviceId: "",
        toggleType,
      })
    );

    // No response for now from the action -> reset to `none` value
    expect(result.current.state).toEqual(
      expect.objectContaining({
        toggleStatus: "none",
      })
    );

    await act(async () => {
      jest.advanceTimersByTime(delayMs);
    });

    expect(result.current.state).toEqual({
      toggleStatus: "success",
    });

    // Step 2: exit
    toggleType = "exit";
    rerender();

    // No response for now from the action -> reset to `none` value
    expect(result.current.state).toEqual(
      expect.objectContaining({
        toggleStatus: "none",
      })
    );

    await act(async () => {
      jest.advanceTimersByTime(delayMs);
    });

    expect(result.current.state).toEqual({
      toggleStatus: "success",
    });

    // Step 3: consumer reset manually with a `null` value
    toggleType = null;
    rerender();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });

    expect(result.current.state).toEqual(
      expect.objectContaining({
        toggleStatus: "none",
      })
    );

    // Step 4: again an enter
    toggleType = "enter";
    rerender();

    // No response for now from the action -> reset to `none` value
    expect(result.current.state).toEqual(
      expect.objectContaining({
        toggleStatus: "none",
      })
    );

    await act(async () => {
      jest.advanceTimersByTime(delayMs);
    });

    expect(result.current.state).toEqual({
      toggleStatus: "success",
    });
  });
});
