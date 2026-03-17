import { renderHook, act } from "@tests/test-renderer";
import useQueuedDrawerBottomSheet from "../useQueuedDrawerBottomSheet";

const mockPresent = jest.fn();
const mockDismiss = jest.fn();

jest.mock("@ledgerhq/lumen-ui-rnative", () => ({
  ...jest.requireActual("@ledgerhq/lumen-ui-rnative"),
  useBottomSheetRef: () => ({ current: { present: mockPresent, dismiss: mockDismiss } }),
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: () => true,
}));

const mockRemoveDrawerFromQueue = jest.fn();
const mockAddDrawerToQueue = jest.fn().mockImplementation(() => ({
  removeDrawerFromQueue: mockRemoveDrawerFromQueue,
  getPositionInQueue: () => 0,
}));

jest.mock("../QueuedDrawersContext", () => ({
  useQueuedDrawerContext: () => ({
    addDrawerToQueue: mockAddDrawerToQueue,
    closeAllDrawers: jest.fn(),
    _clearQueueDIRTYDONOTUSE: jest.fn(),
  }),
}));

function setupDrawerStateCapture() {
  let onDrawerStateChanged: ((isOpen: boolean) => void) | undefined;
  mockAddDrawerToQueue.mockImplementation(callback => {
    onDrawerStateChanged = callback;
    return {
      removeDrawerFromQueue: mockRemoveDrawerFromQueue,
      getPositionInQueue: () => 0,
    };
  });
  return {
    signal: (isOpen: boolean) => {
      act(() => {
        onDrawerStateChanged?.(isOpen);
      });
    },
  };
}

describe("useQueuedDrawerBottomSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls present() when the queue signals the drawer to open", () => {
    const { signal } = setupDrawerStateCapture();

    renderHook(() =>
      useQueuedDrawerBottomSheet({
        isRequestingToBeOpened: true,
      }),
    );

    expect(mockAddDrawerToQueue).toHaveBeenCalledTimes(1);

    signal(true);

    expect(mockPresent).toHaveBeenCalledTimes(1);
  });

  it("calls dismiss() when the queue signals the drawer to close", () => {
    const { signal } = setupDrawerStateCapture();

    renderHook(() =>
      useQueuedDrawerBottomSheet({
        isRequestingToBeOpened: true,
      }),
    );

    signal(true);
    expect(mockPresent).toHaveBeenCalledTimes(1);

    signal(false);
    expect(mockDismiss).toHaveBeenCalled();
  });

  it("does not remove from queue on close signal, only when handleDismiss fires after animation", () => {
    const { signal } = setupDrawerStateCapture();

    const { result } = renderHook(() =>
      useQueuedDrawerBottomSheet({
        isRequestingToBeOpened: true,
      }),
    );

    signal(true);
    signal(false);
    expect(mockRemoveDrawerFromQueue).not.toHaveBeenCalled();

    act(() => {
      result.current.handleDismiss();
    });

    expect(mockRemoveDrawerFromQueue).toHaveBeenCalledTimes(1);
  });

  it("calls onClose callback when the queue signals close", () => {
    const onClose = jest.fn();
    const { signal } = setupDrawerStateCapture();

    renderHook(() =>
      useQueuedDrawerBottomSheet({
        isRequestingToBeOpened: true,
        onClose,
      }),
    );

    signal(true);
    signal(false);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onModalHide when handleDismiss is invoked", () => {
    const onModalHide = jest.fn();
    const { signal } = setupDrawerStateCapture();

    const { result } = renderHook(() =>
      useQueuedDrawerBottomSheet({
        isRequestingToBeOpened: true,
        onModalHide,
      }),
    );

    signal(true);

    act(() => {
      result.current.handleDismiss();
    });

    expect(onModalHide).toHaveBeenCalledTimes(1);
  });

  it("does not call present() twice if already open", () => {
    const { signal } = setupDrawerStateCapture();

    renderHook(() =>
      useQueuedDrawerBottomSheet({
        isRequestingToBeOpened: true,
      }),
    );

    signal(true);
    signal(true);

    expect(mockPresent).toHaveBeenCalledTimes(1);
  });

  it("does not call dismiss() if already closed", () => {
    renderHook(() =>
      useQueuedDrawerBottomSheet({
        isRequestingToBeOpened: false,
      }),
    );

    expect(mockDismiss).not.toHaveBeenCalled();
  });

  it("does not call removeDrawerFromQueue on close signal until handleDismiss fires", () => {
    const { signal } = setupDrawerStateCapture();

    const { result } = renderHook(() =>
      useQueuedDrawerBottomSheet({
        isRequestingToBeOpened: true,
      }),
    );

    signal(true);
    expect(mockPresent).toHaveBeenCalledTimes(1);

    signal(false);
    expect(mockDismiss).toHaveBeenCalledTimes(1);
    expect(mockRemoveDrawerFromQueue).not.toHaveBeenCalled();

    act(() => {
      result.current.handleDismiss();
    });
    expect(mockRemoveDrawerFromQueue).toHaveBeenCalledTimes(1);
  });

  it("does not call removeDrawerFromQueue when handleClose is invoked multiple times before handleDismiss", () => {
    const { signal } = setupDrawerStateCapture();

    const { result } = renderHook(() =>
      useQueuedDrawerBottomSheet({
        isRequestingToBeOpened: true,
      }),
    );

    signal(true);
    expect(mockPresent).toHaveBeenCalledTimes(1);

    signal(false);
    expect(mockDismiss).toHaveBeenCalledTimes(1);
    expect(mockRemoveDrawerFromQueue).not.toHaveBeenCalled();

    signal(false);
    expect(mockRemoveDrawerFromQueue).not.toHaveBeenCalled();

    act(() => {
      result.current.handleDismiss();
    });
    expect(mockRemoveDrawerFromQueue).toHaveBeenCalledTimes(1);
  });

  it("does not call removeDrawerFromQueue when effect cleanup fires during dismiss animation", () => {
    const { signal } = setupDrawerStateCapture();
    let isRequestingToBeOpened = true;

    const { result, rerender } = renderHook(() =>
      useQueuedDrawerBottomSheet({ isRequestingToBeOpened }),
    );

    signal(true);
    expect(mockPresent).toHaveBeenCalledTimes(1);

    signal(false);
    expect(mockDismiss).toHaveBeenCalledTimes(1);
    expect(mockRemoveDrawerFromQueue).not.toHaveBeenCalled();

    isRequestingToBeOpened = false;
    rerender(undefined);
    expect(mockRemoveDrawerFromQueue).not.toHaveBeenCalled();

    act(() => {
      result.current.handleDismiss();
    });
    expect(mockRemoveDrawerFromQueue).toHaveBeenCalledTimes(1);
  });

  it("cleans up the queue immediately when closed without ever being presented", () => {
    const { signal } = setupDrawerStateCapture();

    renderHook(() =>
      useQueuedDrawerBottomSheet({
        isRequestingToBeOpened: true,
      }),
    );

    signal(false);

    expect(mockDismiss).not.toHaveBeenCalled();
    expect(mockRemoveDrawerFromQueue).toHaveBeenCalledTimes(1);
  });

  it("cleans up the queue on unmount", () => {
    const { signal } = setupDrawerStateCapture();

    const { unmount } = renderHook(() =>
      useQueuedDrawerBottomSheet({
        isRequestingToBeOpened: true,
      }),
    );

    signal(true);

    unmount();

    expect(mockRemoveDrawerFromQueue).toHaveBeenCalled();
  });

  it("does not call onClose when drawer receives close signal before ever being opened", () => {
    const onClose = jest.fn();
    const { signal } = setupDrawerStateCapture();

    renderHook(() =>
      useQueuedDrawerBottomSheet({
        isRequestingToBeOpened: true,
        onClose,
      }),
    );

    signal(false);

    expect(onClose).not.toHaveBeenCalled();
    expect(mockRemoveDrawerFromQueue).toHaveBeenCalledTimes(1);
  });

  it("calls onClose exactly once when handleClose is called multiple times during dismiss", () => {
    const onClose = jest.fn();
    const { signal } = setupDrawerStateCapture();

    const { result } = renderHook(() =>
      useQueuedDrawerBottomSheet({
        isRequestingToBeOpened: true,
        onClose,
      }),
    );

    signal(true);
    signal(false);
    expect(onClose).toHaveBeenCalledTimes(1);

    signal(false);
    expect(onClose).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.handleDismiss();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose via handleDismiss when user swipes to dismiss (bypassing handleClose)", () => {
    const onClose = jest.fn();
    const { signal } = setupDrawerStateCapture();

    const { result } = renderHook(() =>
      useQueuedDrawerBottomSheet({
        isRequestingToBeOpened: true,
        onClose,
      }),
    );

    signal(true);
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      result.current.handleDismiss();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockRemoveDrawerFromQueue).toHaveBeenCalledTimes(1);
  });

  it("does not recreate handleDismiss when onModalHide changes", () => {
    const { signal } = setupDrawerStateCapture();
    let onModalHide = jest.fn();

    const { result, rerender } = renderHook(() =>
      useQueuedDrawerBottomSheet({
        isRequestingToBeOpened: true,
        onModalHide,
      }),
    );

    signal(true);

    const firstHandleDismiss = result.current.handleDismiss;
    onModalHide = jest.fn();
    rerender(undefined);

    expect(result.current.handleDismiss).toBe(firstHandleDismiss);
  });

  it("calls the latest onModalHide even though handleDismiss is stable", () => {
    const { signal } = setupDrawerStateCapture();
    const firstOnModalHide = jest.fn();
    const secondOnModalHide = jest.fn();
    let onModalHide = firstOnModalHide;

    const { result, rerender } = renderHook(() =>
      useQueuedDrawerBottomSheet({
        isRequestingToBeOpened: true,
        onModalHide,
      }),
    );

    signal(true);
    onModalHide = secondOnModalHide;
    rerender(undefined);

    act(() => {
      result.current.handleDismiss();
    });

    expect(firstOnModalHide).not.toHaveBeenCalled();
    expect(secondOnModalHide).toHaveBeenCalledTimes(1);
  });
});
