import { useState } from "react";
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

  it("does not remove from queue on close signal, only when handleDismiss fires after animation", () => {
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();

    const { result } = renderHook(() =>
      useQueuedBottomSheet({
        isRequestingToBeOpened: true,
      }),
    );

    signalOpen();
    signalClose();
    expect(mockRemoveBottomSheetFromQueue).not.toHaveBeenCalled();

    act(() => {
      result.current.handleDismiss();
    });

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

  it("does not call removeBottomSheetFromQueue on close signal until handleDismiss fires", () => {
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
    expect(mockRemoveBottomSheetFromQueue).not.toHaveBeenCalled();

    act(() => {
      result.current.handleDismiss();
    });
    expect(mockRemoveBottomSheetFromQueue).toHaveBeenCalledTimes(1);
  });

  it("does not call removeBottomSheetFromQueue when handleClose is invoked multiple times before handleDismiss", () => {
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
    expect(mockRemoveBottomSheetFromQueue).not.toHaveBeenCalled();

    signalClose();
    expect(mockRemoveBottomSheetFromQueue).not.toHaveBeenCalled();

    act(() => {
      result.current.handleDismiss();
    });
    expect(mockRemoveBottomSheetFromQueue).toHaveBeenCalledTimes(1);
  });

  it("does not call removeBottomSheetFromQueue when effect cleanup fires during dismiss animation", () => {
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();
    let isRequestingToBeOpened = true;

    const { result, rerender } = renderHook(() => useQueuedBottomSheet({ isRequestingToBeOpened }));

    signalOpen();
    expect(mockPresent).toHaveBeenCalledTimes(1);

    signalClose();
    expect(mockDismiss).toHaveBeenCalledTimes(1);
    expect(mockRemoveBottomSheetFromQueue).not.toHaveBeenCalled();

    isRequestingToBeOpened = false;
    rerender(undefined);
    expect(mockRemoveBottomSheetFromQueue).not.toHaveBeenCalled();

    act(() => {
      result.current.handleDismiss();
    });
    expect(mockRemoveBottomSheetFromQueue).toHaveBeenCalledTimes(1);
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
      result.current.handleCloseAnimationStart(0, -1);
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
      result.current.handleCloseAnimationStart(0, -1);
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
      result.current.handleCloseAnimationStart(-1, 0); // opening
      result.current.handleCloseAnimationStart(0, 1); // expanding to a higher snap point
    });

    expect(onClose).not.toHaveBeenCalled();
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

    // Close starts, then finishes while the consumer still requests the drawer to be open.
    act(() => {
      result.current.handleCloseAnimationStart(0, -1);
    });
    act(() => {
      result.current.handleDismiss();
    });

    // Re-enqueued so it can open again on the first interaction.
    expect(mockAddBottomSheetToQueue).toHaveBeenCalledTimes(2);

    signalOpen();
    expect(mockPresent).toHaveBeenCalledTimes(2);
  });

  it("does not reopen when the consumer's onClose-driven state change is batched with handleDismiss", () => {
    // Reproduces the race condition: handleCloseAnimationStart triggers the consumer's onClose,
    // which schedules a setState to clear isRequestingToBeOpened. If handleDismiss reads a ref
    // before React has rendered that update, the old reopen guard would re-enqueue the drawer.
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

    // In production these fire from separate native callbacks separated by the close animation.
    // Inside a single act() they are batched together, which is exactly the case the old code got
    // wrong: at handleDismiss time, the ref still holds the pre-onClose value.
    act(() => {
      result.current.handleCloseAnimationStart(0, -1);
      result.current.handleDismiss();
    });

    expect(mockAddBottomSheetToQueue).toHaveBeenCalledTimes(1);
  });

  it("does not reopen after dismiss when it is no longer requested (normal close)", () => {
    const { signalOpen, signalClose } = setupBottomSheetStateCapture();
    let isRequestingToBeOpened = true;

    const { result, rerender } = renderHook(() => useQueuedBottomSheet({ isRequestingToBeOpened }));

    signalOpen();
    expect(mockAddBottomSheetToQueue).toHaveBeenCalledTimes(1);

    // Consumer clears its request (drawer genuinely closed), then the sheet finishes dismissing.
    isRequestingToBeOpened = false;
    rerender(undefined);

    act(() => {
      result.current.handleDismiss();
    });

    expect(mockAddBottomSheetToQueue).toHaveBeenCalledTimes(1);
  });
});
