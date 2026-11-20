import React from "react";
import { act, renderHook } from "@testing-library/react-native";
import type { QueuedBottomSheetAdapters } from "../adapters";
import { QueuedBottomSheetsProvider } from "../components/QueuedBottomSheetsProvider";
import { useQueuedBottomSheetContext } from "../contexts/QueuedBottomSheetsContext";
import { useQueuedBottomSheetTurn } from "./useQueuedBottomSheetTurn";

let isScreenFocused = true;
let areSheetsLocked = false;

const adapters: QueuedBottomSheetAdapters = {
  useAreBottomSheetsLocked: () => areSheetsLocked,
  useIsScreenFocused: () => isScreenFocused,
  log: () => {},
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueuedBottomSheetsProvider adapters={adapters}>{children}</QueuedBottomSheetsProvider>
);

function renderTurn(isRequesting: boolean) {
  return renderHook(
    ({ isRequestingToBeOpened }: { isRequestingToBeOpened: boolean }) => ({
      turn: useQueuedBottomSheetTurn(isRequestingToBeOpened),
      queue: useQueuedBottomSheetContext(),
    }),
    { wrapper, initialProps: { isRequestingToBeOpened: isRequesting } },
  );
}

describe("useQueuedBottomSheetTurn", () => {
  beforeEach(() => {
    isScreenFocused = true;
    areSheetsLocked = false;
  });

  it("has no turn until requested, then gets it right away with an empty queue", () => {
    const { result, rerender } = renderTurn(false);
    expect(result.current.turn.hasTurn).toBe(false);

    rerender({ isRequestingToBeOpened: true });

    expect(result.current.turn.hasTurn).toBe(true);
  });

  it("waits for the sheet before it to leave the queue", () => {
    const { result, rerender } = renderTurn(false);
    let sheetAhead = { removeBottomSheetFromQueue: () => {} };
    act(() => {
      sheetAhead = result.current.queue.addBottomSheetToQueue(
        { open: () => {}, close: () => {} },
        false,
      );
    });

    rerender({ isRequestingToBeOpened: true });
    expect(result.current.turn.hasTurn).toBe(false);
    act(() => sheetAhead.removeBottomSheetFromQueue());

    expect(result.current.turn.hasTurn).toBe(true);
  });

  it("gives its turn to a sheet forced in, and gets it back once that sheet is gone", () => {
    const { result } = renderTurn(true);
    let forcedSheet = { removeBottomSheetFromQueue: () => {} };

    act(() => {
      forcedSheet = result.current.queue.addBottomSheetToQueue(
        { open: () => {}, close: () => {} },
        true,
      );
    });
    expect(result.current.turn.hasTurn).toBe(false);
    act(() => forcedSheet.removeBottomSheetFromQueue());

    expect(result.current.turn.hasTurn).toBe(true);
  });

  it("doesn't come back after every sheet closed, and asks to be dismissed", () => {
    const onClosingAll = jest.fn();
    const { result } = renderHook(
      () => ({
        turn: useQueuedBottomSheetTurn(true, { onClosingAll }),
        queue: useQueuedBottomSheetContext(),
      }),
      { wrapper },
    );

    act(() => result.current.queue.closeAllBottomSheets());

    expect(result.current.turn.hasTurn).toBe(false);
    expect(onClosingAll).toHaveBeenCalledTimes(1);
  });

  it("keeps the next sheet waiting until its view is hidden, when it animates out", () => {
    const nextOpen = jest.fn();
    const { result, rerender } = renderHook(
      ({ isRequestingToBeOpened }: { isRequestingToBeOpened: boolean }) => ({
        turn: useQueuedBottomSheetTurn(isRequestingToBeOpened, { waitsForHidden: true }),
        queue: useQueuedBottomSheetContext(),
      }),
      { wrapper, initialProps: { isRequestingToBeOpened: true } },
    );
    act(() => {
      result.current.queue.addBottomSheetToQueue({ open: nextOpen, close: () => {} }, false);
    });

    rerender({ isRequestingToBeOpened: false });
    expect(result.current.turn.hasTurn).toBe(false);
    expect(nextOpen).not.toHaveBeenCalled();
    act(() => result.current.turn.onHidden());

    expect(nextOpen).toHaveBeenCalledTimes(1);
  });

  it("lets the next sheet in anyway when its view never reports it's hidden", () => {
    jest.useFakeTimers();
    const nextOpen = jest.fn();
    const { result, rerender } = renderHook(
      ({ isRequestingToBeOpened }: { isRequestingToBeOpened: boolean }) => ({
        turn: useQueuedBottomSheetTurn(isRequestingToBeOpened, { waitsForHidden: true }),
        queue: useQueuedBottomSheetContext(),
      }),
      { wrapper, initialProps: { isRequestingToBeOpened: true } },
    );
    act(() => {
      result.current.queue.addBottomSheetToQueue({ open: nextOpen, close: () => {} }, false);
    });

    rerender({ isRequestingToBeOpened: false });
    act(() => jest.advanceTimersByTime(600));

    expect(nextOpen).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it("lets the next sheet in once hidden after a sheet is forced in, then queues again behind it", () => {
    const { result } = renderHook(
      () => ({
        turn: useQueuedBottomSheetTurn(true, { waitsForHidden: true }),
        queue: useQueuedBottomSheetContext(),
      }),
      { wrapper },
    );
    const forcedOpen = jest.fn();
    let forcedSheet = { removeBottomSheetFromQueue: () => {} };
    act(() => {
      forcedSheet = result.current.queue.addBottomSheetToQueue(
        { open: forcedOpen, close: () => {} },
        true,
      );
    });
    expect(result.current.turn.hasTurn).toBe(false);
    expect(forcedOpen).not.toHaveBeenCalled();

    act(() => result.current.turn.onHidden());
    expect(forcedOpen).toHaveBeenCalledTimes(1);
    act(() => forcedSheet.removeBottomSheetFromQueue());

    expect(result.current.turn.hasTurn).toBe(true);
  });

  it("has no turn while its screen isn't focused, and gets it back once focused", () => {
    isScreenFocused = false;
    const { result, rerender } = renderTurn(true);
    expect(result.current.turn.hasTurn).toBe(false);

    isScreenFocused = true;
    rerender({ isRequestingToBeOpened: true });

    expect(result.current.turn.hasTurn).toBe(true);
  });

  it("says when sheets are locked", () => {
    areSheetsLocked = true;
    const { result } = renderTurn(true);

    expect(result.current.turn.areBottomSheetsLocked).toBe(true);
  });
});
