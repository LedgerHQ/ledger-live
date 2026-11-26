/**
 * @jest-environment jsdom
 */
import { act } from "@testing-library/react";
import { selectKeyRingTreeId } from "@domain/entity-key-ring";
import { mockKeyRingState } from "@domain/entity-key-ring/slice.mock";
import { resetKeyRingState, selectKeyRingSession } from "@features/platform-key-ring";
import { newTreeUpdate } from "../__tests__/fixtures";
import { renderLedgerSyncHook } from "../__tests__/harness";
import { useLedgerSyncResultAcceptance } from "./useLedgerSyncResultAcceptance";

describe("useLedgerSyncResultAcceptance", () => {
  it("should store the key tree, keep the result and call onFirstAccepted", () => {
    const { result, store } = renderLedgerSyncHook(() => useLedgerSyncResultAcceptance<string>());
    const runSession = selectKeyRingSession(store.getState());
    const onFirstAccepted = jest.fn();

    let isAccepted = false;
    act(() => {
      isAccepted = result.current.accept(
        newTreeUpdate("first-root"),
        runSession,
        "first",
        onFirstAccepted,
      );
    });

    expect(isAccepted).toBe(true);
    expect(selectKeyRingTreeId(store.getState())).toBe("first-root");
    expect(result.current.resultRef.current).toBe("first");
    expect(onFirstAccepted).toHaveBeenCalledTimes(1);
  });

  it("should keep the latest result but call onFirstAccepted once when a retry delivers too", () => {
    const { result, store } = renderLedgerSyncHook(() => useLedgerSyncResultAcceptance<string>());
    const runSession = selectKeyRingSession(store.getState());
    const onFirstAccepted = jest.fn();

    act(() => {
      result.current.accept(newTreeUpdate("first-root"), runSession, "first", onFirstAccepted);
      result.current.accept(newTreeUpdate("retry-root"), runSession, "retry", onFirstAccepted);
    });

    expect(onFirstAccepted).toHaveBeenCalledTimes(1);
    expect(result.current.resultRef.current).toBe("retry");
    expect(selectKeyRingTreeId(store.getState())).toBe("retry-root");
  });

  it("should drop the result of a run that started before a reset", () => {
    const { result, store } = renderLedgerSyncHook(() => useLedgerSyncResultAcceptance<string>(), {
      trustchain: mockKeyRingState(),
    });
    const runSession = selectKeyRingSession(store.getState());
    const onFirstAccepted = jest.fn();
    act(() => {
      store.dispatch(resetKeyRingState());
    });

    let isAccepted = true;
    act(() => {
      isAccepted = result.current.accept(
        newTreeUpdate("late-root"),
        runSession,
        "late",
        onFirstAccepted,
      );
    });

    expect(isAccepted).toBe(false);
    expect(selectKeyRingTreeId(store.getState())).toBeNull();
    expect(result.current.resultRef.current).toBeNull();
    expect(onFirstAccepted).not.toHaveBeenCalled();
  });

  it("should keep accept across renders", () => {
    const { result, rerender } = renderLedgerSyncHook(() =>
      useLedgerSyncResultAcceptance<string>(),
    );
    const { accept } = result.current;
    rerender();
    expect(result.current.accept).toBe(accept);
  });
});
