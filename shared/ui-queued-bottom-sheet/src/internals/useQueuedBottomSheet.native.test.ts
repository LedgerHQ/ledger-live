import { useState } from "react";
import { Keyboard } from "react-native";
import { renderHook, act } from "@testing-library/react-native";
import { useQueuedBottomSheet } from "./useQueuedBottomSheet";
import type { BottomSheetStateHandlers } from "../contexts/QueuedBottomSheetsContext";

const mockPresent = jest.fn();
const mockDismiss = jest.fn();

jest.mock("@ledgerhq/lumen-ui-rnative", () => ({
  __esModule: true,
  useBottomSheetRef: () => ({ current: { present: mockPresent, dismiss: mockDismiss } }),
}));

const mockRemoveBottomSheetFromQueue = jest.fn();
const mockAddBottomSheetToQueue = jest.fn().mockImplementation(() => ({
  removeBottomSheetFromQueue: mockRemoveBottomSheetFromQueue,
  getPositionInQueue: () => 0,
}));

jest.mock("../contexts/QueuedBottomSheetsContext", () => ({
  useQueuedBottomSheetContext: () => ({
    addBottomSheetToQueue: mockAddBottomSheetToQueue,
    closeAllBottomSheets: jest.fn(),
    _clearQueueDIRTYDONOTUSE: jest.fn(),
  }),
}));

type HookResult = ReturnType<typeof useQueuedBottomSheet>;

function setupBottomSheetStateCapture() {
  let stateHandlers: BottomSheetStateHandlers | undefined;
  mockAddBottomSheetToQueue.mockImplementation(handlers => {
    stateHandlers = handlers;
    return {
      removeBottomSheetFromQueue: mockRemoveBottomSheetFromQueue,
      getPositionInQueue: () => 0,
    };
  });
  return {
    signalOpen: () => {
      act(() => {
        stateHandlers?.open();
      });
    },
    signalClose: () => {
      act(() => {
        stateHandlers?.close();
      });
    },
  };
}

describe("useQueuedBottomSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("calls present() when the queue signals the drawer to open", () => {
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();

    renderHook(() =>
      useQueuedBottomSheet({
        isRequestingToBeOpened: true,
      }),
    );

    expect(mockAddBottomSheetToQueue).toHaveBeenCalledTimes(1);

    signalOpen();

    expect(mockPresent).toHaveBeenCalledTimes(1);
  });

  it("calls dismiss() when the queue signals the drawer to close", () => {
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();

    renderHook(() =>
      useQueuedBottomSheet({
        isRequestingToBeOpened: true,
      }),
    );

    signalOpen();
    expect(mockPresent).toHaveBeenCalledTimes(1);

    signalClose();
    expect(mockDismiss).toHaveBeenCalled();
  });

  it("frees its queue slot on the close signal rather than waiting for handleDismiss", () => {
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();

    renderHook(() =>
      useQueuedBottomSheet({
        isRequestingToBeOpened: true,
      }),
    );

    signalOpen();
    signalClose();

    expect(mockRemoveBottomSheetFromQueue).toHaveBeenCalledTimes(1);
  });

  it("calls onClose callback when the queue signals close", () => {
    const onClose = jest.fn();
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();

    renderHook(() =>
      useQueuedBottomSheet({
        isRequestingToBeOpened: true,
        onClose,
      }),
    );

    signalOpen();
    signalClose();

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onModalHide when handleDismiss is invoked", () => {
    const onModalHide = jest.fn();
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();

    const { result } = renderHook(() =>
      useQueuedBottomSheet({
        isRequestingToBeOpened: true,
        onModalHide,
      }),
    );

    signalOpen();

    act(() => {
      result.current.handleDismiss();
    });

    expect(onModalHide).toHaveBeenCalledTimes(1);
  });

  it("does not call present() twice if already open", () => {
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();

    renderHook(() =>
      useQueuedBottomSheet({
        isRequestingToBeOpened: true,
      }),
    );

    signalOpen();
    signalOpen();

    expect(mockPresent).toHaveBeenCalledTimes(1);
  });

  it("does not call dismiss() if already closed", () => {
    renderHook(() =>
      useQueuedBottomSheet({
        isRequestingToBeOpened: false,
      }),
    );

    expect(mockDismiss).not.toHaveBeenCalled();
  });

  it("frees its queue slot only once when handleDismiss follows the close signal", () => {
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();

    const { result } = renderHook(() =>
      useQueuedBottomSheet({
        isRequestingToBeOpened: true,
      }),
    );

    signalOpen();
    expect(mockPresent).toHaveBeenCalledTimes(1);

    signalClose();
    expect(mockDismiss).toHaveBeenCalledTimes(1);
    expect(mockRemoveBottomSheetFromQueue).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.handleDismiss();
    });
    expect(mockRemoveBottomSheetFromQueue).toHaveBeenCalledTimes(1);
  });

  it("frees its queue slot only once when handleClose is invoked repeatedly", () => {
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();

    const { result } = renderHook(() =>
      useQueuedBottomSheet({
        isRequestingToBeOpened: true,
      }),
    );

    signalOpen();
    expect(mockPresent).toHaveBeenCalledTimes(1);

    signalClose();
    expect(mockDismiss).toHaveBeenCalledTimes(1);
    expect(mockRemoveBottomSheetFromQueue).toHaveBeenCalledTimes(1);

    signalClose();
    expect(mockRemoveBottomSheetFromQueue).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.handleDismiss();
    });
    expect(mockRemoveBottomSheetFromQueue).toHaveBeenCalledTimes(1);
  });

  it("frees its queue slot only once when effect cleanup fires during the dismiss animation", () => {
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();
    let isRequestingToBeOpened = true;

    const { result, rerender } = renderHook(() => useQueuedBottomSheet({ isRequestingToBeOpened }));

    signalOpen();
    expect(mockPresent).toHaveBeenCalledTimes(1);

    signalClose();
    expect(mockDismiss).toHaveBeenCalledTimes(1);
    expect(mockRemoveBottomSheetFromQueue).toHaveBeenCalledTimes(1);

    isRequestingToBeOpened = false;
    rerender(undefined);
    expect(mockRemoveBottomSheetFromQueue).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.handleDismiss();
    });
    expect(mockRemoveBottomSheetFromQueue).toHaveBeenCalledTimes(1);
  });

  it("settles itself as closed when onDismiss never arrives", () => {
    jest.useFakeTimers();
    try {
      const { signalOpen, signalClose } = setupBottomSheetStateCapture();

      renderHook(() => useQueuedBottomSheet({ isRequestingToBeOpened: true }));

      signalOpen();
      expect(mockPresent).toHaveBeenCalledTimes(1);

      signalClose();

      signalOpen();
      expect(mockPresent).toHaveBeenCalledTimes(1);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      signalOpen();
      expect(mockPresent).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });

  it("declines a queue promotion once the consumer has stopped requesting it", () => {
    const { signalOpen } = setupBottomSheetStateCapture();
    let isRequestingToBeOpened = true;

    const { rerender } = renderHook(() => useQueuedBottomSheet({ isRequestingToBeOpened }));

    expect(mockAddBottomSheetToQueue).toHaveBeenCalledTimes(1);

    // The sheet ahead of us closed and the same interaction cleared our own reason to be open.
    // Presenting now would leave an empty sheet on screen that swallows the next tap.
    isRequestingToBeOpened = false;
    rerender(undefined);
    signalOpen();

    expect(mockPresent).not.toHaveBeenCalled();
    expect(mockRemoveBottomSheetFromQueue).toHaveBeenCalled();
  });

  it("cleans up the queue immediately when closed without ever being presented", () => {
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();

    renderHook(() =>
      useQueuedBottomSheet({
        isRequestingToBeOpened: true,
      }),
    );

    signalClose();

    expect(mockDismiss).not.toHaveBeenCalled();
    expect(mockRemoveBottomSheetFromQueue).toHaveBeenCalledTimes(1);
  });

  it("cleans up the queue on unmount", () => {
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();

    const { unmount } = renderHook(() =>
      useQueuedBottomSheet({
        isRequestingToBeOpened: true,
      }),
    );

    signalOpen();

    unmount();

    expect(mockRemoveBottomSheetFromQueue).toHaveBeenCalled();
  });

  it("does not call onClose when drawer receives close signal before ever being opened", () => {
    const onClose = jest.fn();
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();

    renderHook(() =>
      useQueuedBottomSheet({
        isRequestingToBeOpened: true,
        onClose,
      }),
    );

    signalClose();

    expect(onClose).not.toHaveBeenCalled();
    expect(mockRemoveBottomSheetFromQueue).toHaveBeenCalledTimes(1);
  });

  it("calls onClose exactly once when handleClose is called multiple times during dismiss", () => {
    const onClose = jest.fn();
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();

    const { result } = renderHook(() =>
      useQueuedBottomSheet({
        isRequestingToBeOpened: true,
        onClose,
      }),
    );

    signalOpen();
    signalClose();
    expect(onClose).toHaveBeenCalledTimes(1);

    signalClose();
    expect(onClose).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.handleDismiss();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose via handleDismiss when user swipes to dismiss (bypassing handleClose)", () => {
    const onClose = jest.fn();
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();

    const { result } = renderHook(() =>
      useQueuedBottomSheet({
        isRequestingToBeOpened: true,
        onClose,
      }),
    );

    signalOpen();
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      result.current.handleDismiss();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockRemoveBottomSheetFromQueue).toHaveBeenCalledTimes(1);
  });

  it("does not recreate handleDismiss when onModalHide changes", () => {
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();
    let onModalHide = jest.fn();

    const { result, rerender } = renderHook(() =>
      useQueuedBottomSheet({
        isRequestingToBeOpened: true,
        onModalHide,
      }),
    );

    signalOpen();

    const firstHandleDismiss = result.current.handleDismiss;
    onModalHide = jest.fn();
    rerender(undefined);

    expect(result.current.handleDismiss).toBe(firstHandleDismiss);
  });

  it("calls the latest onModalHide even though handleDismiss is stable", () => {
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();
    const firstOnModalHide = jest.fn();
    const secondOnModalHide = jest.fn();
    let onModalHide = firstOnModalHide;

    const { result, rerender } = renderHook(() =>
      useQueuedBottomSheet({
        isRequestingToBeOpened: true,
        onModalHide,
      }),
    );

    signalOpen();
    onModalHide = secondOnModalHide;
    rerender(undefined);

    act(() => {
      result.current.handleDismiss();
    });

    expect(firstOnModalHide).not.toHaveBeenCalled();
    expect(secondOnModalHide).toHaveBeenCalledTimes(1);
  });

  it("clears consumer state at the start of the close animation, and not again on dismiss", () => {
    const onClose = jest.fn();
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();

    const { result } = renderHook(() =>
      useQueuedBottomSheet({
        isRequestingToBeOpened: true,
        onClose,
      }),
    );

    signalOpen();
    expect(onClose).not.toHaveBeenCalled();

    // X button / backdrop / pan-down all animate towards index -1.
    act(() => {
      result.current.handleAnimate(0, -1);
    });
    expect(onClose).toHaveBeenCalledTimes(1);

    // onDismiss fires later (after the animation) and must not clear again.
    act(() => {
      result.current.handleDismiss();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls header close callbacks once and ignores later close animation and dismiss callbacks", () => {
    const onClose = jest.fn();
    const onHeaderClosePressed = jest.fn();
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();

    const { result } = renderHook(() =>
      useQueuedBottomSheet({
        isRequestingToBeOpened: true,
        onClose,
        onHeaderClosePressed,
      }),
    );

    signalOpen();

    act(() => {
      result.current.handleHeaderClosePressed();
    });

    expect(onHeaderClosePressed).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.handleAnimate(0, -1);
      result.current.handleDismiss();
    });

    expect(onHeaderClosePressed).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not clear consumer state on open or snap-point animations", () => {
    const onClose = jest.fn();
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();

    const { result } = renderHook(() =>
      useQueuedBottomSheet({
        isRequestingToBeOpened: true,
        onClose,
      }),
    );

    signalOpen();

    act(() => {
      result.current.handleAnimate(-1, 0); // opening
      result.current.handleAnimate(0, 1); // expanding to a higher snap point
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("dismisses a minimized sheet that the modal stack restores behind our back", () => {
    const onClose = jest.fn();
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();

    const { result } = renderHook(() =>
      useQueuedBottomSheet({
        isRequestingToBeOpened: true,
        onClose,
      }),
    );

    signalOpen();
    act(() => {
      result.current.handleAnimate(-1, 0);
    });

    act(() => {
      result.current.handleAnimate(0, -1);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockDismiss).not.toHaveBeenCalled();

    act(() => {
      result.current.handleAnimate(-1, 0);
    });

    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  it("still dismisses a sheet that the modal stack minimized behind our back", () => {
    const onClose = jest.fn();
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();

    const { result } = renderHook(() =>
      useQueuedBottomSheet({
        isRequestingToBeOpened: true,
        onClose,
      }),
    );

    signalOpen();
    act(() => {
      result.current.handleAnimate(-1, 0);
    });

    act(() => {
      result.current.handleAnimate(0, -1);
    });
    expect(onClose).toHaveBeenCalledTimes(1);

    signalClose();

    expect(mockDismiss).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.handleDismiss();
    });
    expect(mockRemoveBottomSheetFromQueue).toHaveBeenCalledTimes(1);
  });

  it("replays a dismiss that was dropped because the sheet had not opened yet", () => {
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();

    const { result } = renderHook(() =>
      useQueuedBottomSheet({
        isRequestingToBeOpened: true,
      }),
    );

    signalOpen();
    signalClose();
    expect(mockDismiss).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.handleAnimate(-1, 0);
    });

    expect(mockDismiss).toHaveBeenCalledTimes(2);

    act(() => {
      result.current.handleDismiss();
    });

    expect(mockRemoveBottomSheetFromQueue).toHaveBeenCalledTimes(1);
  });

  it("does not replay a dismiss once the sheet has opened normally", () => {
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();

    const { result } = renderHook(() =>
      useQueuedBottomSheet({
        isRequestingToBeOpened: true,
      }),
    );

    signalOpen();
    act(() => {
      result.current.handleAnimate(-1, 0);
    });

    signalClose();
    expect(mockDismiss).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.handleAnimate(0, 1);
    });

    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  it("reopens the drawer after dismiss when it is still requested (re-tapped while closing)", () => {
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();

    const { result } = renderHook(() =>
      useQueuedBottomSheet({
        isRequestingToBeOpened: true,
      }),
    );

    signalOpen();
    expect(mockPresent).toHaveBeenCalledTimes(1);
    expect(mockAddBottomSheetToQueue).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.handleAnimate(0, -1);
    });
    act(() => {
      result.current.handleDismiss();
    });

    expect(mockAddBottomSheetToQueue).toHaveBeenCalledTimes(2);

    signalOpen();
    expect(mockPresent).toHaveBeenCalledTimes(2);
  });

  it("does not reopen when the consumer's onClose-driven state change is batched with handleDismiss", () => {
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();

    const { result } = renderHook(() => {
      const [isOpen, setIsOpen] = useState(true);
      return useQueuedBottomSheet({
        isRequestingToBeOpened: isOpen,
        onClose: () => setIsOpen(false),
      });
    });

    signalOpen();
    expect(mockAddBottomSheetToQueue).toHaveBeenCalledTimes(1);
    expect(mockPresent).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.handleAnimate(0, -1);
      result.current.handleDismiss();
    });

    expect(mockAddBottomSheetToQueue).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["the close animation starts", (result: HookResult) => result.handleAnimate(0, -1)],
    ["the header close is pressed", (result: HookResult) => result.handleHeaderClosePressed()],
    ["the backdrop is pressed", (result: HookResult) => result.handleBackdropPress()],
  ])("retracts the keyboard as soon as %s", (_description, startClose) => {
    const dismissKeyboard = jest.spyOn(Keyboard, "dismiss");
    jest.spyOn(Keyboard, "isVisible").mockReturnValue(true);
    const { signalOpen } = setupBottomSheetStateCapture();

    const { result } = renderHook(() => useQueuedBottomSheet({ isRequestingToBeOpened: true }));

    signalOpen();
    expect(dismissKeyboard).not.toHaveBeenCalled();

    act(() => {
      startClose(result.current);
    });

    expect(dismissKeyboard).toHaveBeenCalled();
  });

  it("retracts the keyboard when the queue closes the drawer", () => {
    const dismissKeyboard = jest.spyOn(Keyboard, "dismiss");
    jest.spyOn(Keyboard, "isVisible").mockReturnValue(true);
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();

    renderHook(() => useQueuedBottomSheet({ isRequestingToBeOpened: true }));

    signalOpen();
    signalClose();

    expect(dismissKeyboard).toHaveBeenCalled();
  });

  it("retracts the keyboard when a dismissal bypasses the close animation", () => {
    const dismissKeyboard = jest.spyOn(Keyboard, "dismiss");
    jest.spyOn(Keyboard, "isVisible").mockReturnValue(true);
    const { signalOpen } = setupBottomSheetStateCapture();

    const { result } = renderHook(() => useQueuedBottomSheet({ isRequestingToBeOpened: true }));

    signalOpen();

    act(() => {
      result.current.handleDismiss();
    });

    expect(dismissKeyboard).toHaveBeenCalled();
  });

  it("leaves the keyboard alone when the dismissal lands after the close already handled it", () => {
    const dismissKeyboard = jest.spyOn(Keyboard, "dismiss");
    const isKeyboardVisible = jest.spyOn(Keyboard, "isVisible").mockReturnValue(false);
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();

    const { result } = renderHook(() => useQueuedBottomSheet({ isRequestingToBeOpened: true }));

    signalOpen();
    signalClose();

    expect(dismissKeyboard).not.toHaveBeenCalled();

    // The sheet that took over focuses its own input, so the keyboard is up again by the time this
    // sheet's onDismiss finally arrives.
    isKeyboardVisible.mockReturnValue(true);

    act(() => {
      result.current.handleDismiss();
    });

    expect(dismissKeyboard).not.toHaveBeenCalled();
  });

  it("does not reopen after dismiss when it is no longer requested (normal close)", () => {
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();
    let isRequestingToBeOpened = true;

    const { result, rerender } = renderHook(() => useQueuedBottomSheet({ isRequestingToBeOpened }));

    signalOpen();
    expect(mockAddBottomSheetToQueue).toHaveBeenCalledTimes(1);

    isRequestingToBeOpened = false;
    rerender(undefined);

    act(() => {
      result.current.handleDismiss();
    });

    expect(mockAddBottomSheetToQueue).toHaveBeenCalledTimes(1);
  });
});
