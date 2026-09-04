import React from "react";
import { renderHook, act } from "@testing-library/react-native";
import { QueuedBottomSheetsProvider } from "./QueuedBottomSheetsProvider";
import { useQueuedBottomSheetContext } from "../../contexts/QueuedBottomSheetsContext";
import type { BottomSheetStateHandlers } from "../../contexts/QueuedBottomSheetsContext";
import type { QueuedBottomSheetAdapters } from "../../adapters";

function createHandlers(): BottomSheetStateHandlers & {
  open: jest.Mock;
  close: jest.Mock;
} {
  return {
    open: jest.fn(),
    close: jest.fn(),
  };
}

function renderQueue(adaptersOverride: Partial<QueuedBottomSheetAdapters> = {}) {
  const log = jest.fn();
  const adapters: QueuedBottomSheetAdapters = {
    useAreBottomSheetsLocked: () => false,
    useIsScreenFocused: () => true,
    log,
    ...adaptersOverride,
  };
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueuedBottomSheetsProvider adapters={adapters}>{children}</QueuedBottomSheetsProvider>
  );
  const { result } = renderHook(() => useQueuedBottomSheetContext(), { wrapper });
  return { result, log };
}

describe("QueuedBottomSheetsProvider", () => {
  it("opens the first drawer immediately when the queue is empty", () => {
    const { result } = renderQueue();
    const handlers = createHandlers();

    act(() => {
      result.current.addBottomSheetToQueue(handlers, false);
    });

    expect(handlers.open).toHaveBeenCalledTimes(1);
    expect(handlers.close).not.toHaveBeenCalled();
  });

  it("queues a second drawer without opening it and reports its position", () => {
    const { result } = renderQueue();
    const handlers1 = createHandlers();
    const handlers2 = createHandlers();
    let handle1!: ReturnType<typeof result.current.addBottomSheetToQueue>;
    let handle2!: ReturnType<typeof result.current.addBottomSheetToQueue>;

    act(() => {
      handle1 = result.current.addBottomSheetToQueue(handlers1, false);
    });
    act(() => {
      handle2 = result.current.addBottomSheetToQueue(handlers2, false);
    });

    expect(handlers2.open).not.toHaveBeenCalled();
    expect(handle1.getPositionInQueue()).toBe(0);
    expect(handle2.getPositionInQueue()).toBe(1);
  });

  it("opens the next queued drawer when the current one is removed", () => {
    const { result } = renderQueue();
    const handlers1 = createHandlers();
    const handlers2 = createHandlers();
    let handle1!: ReturnType<typeof result.current.addBottomSheetToQueue>;

    act(() => {
      handle1 = result.current.addBottomSheetToQueue(handlers1, false);
    });
    act(() => {
      result.current.addBottomSheetToQueue(handlers2, false);
    });

    handlers2.open.mockClear();
    act(() => {
      handle1.removeBottomSheetFromQueue();
    });

    expect(handlers2.open).toHaveBeenCalledTimes(1);
  });

  it("force-opening closes the current and other queued drawers, then opens the forced one", () => {
    const { result } = renderQueue();
    const handlers1 = createHandlers();
    const handlers2 = createHandlers();
    const handlers3 = createHandlers();
    let handle1!: ReturnType<typeof result.current.addBottomSheetToQueue>;

    act(() => {
      handle1 = result.current.addBottomSheetToQueue(handlers1, false);
    });
    act(() => {
      result.current.addBottomSheetToQueue(handlers2, false);
    });

    handlers1.close.mockClear();
    handlers2.close.mockClear();
    act(() => {
      result.current.addBottomSheetToQueue(handlers3, true);
    });

    expect(handlers1.close).toHaveBeenCalledTimes(1);
    expect(handlers2.close).toHaveBeenCalledTimes(1);
    expect(handlers3.open).not.toHaveBeenCalled();

    act(() => {
      handle1.removeBottomSheetFromQueue();
    });

    expect(handlers3.open).toHaveBeenCalledTimes(1);
  });

  it("opens the forced drawer when the closing drawer frees its slot synchronously", () => {
    const { result } = renderQueue();
    const handlers2 = createHandlers();
    let handle1!: ReturnType<typeof result.current.addBottomSheetToQueue>;

    const handlers1 = createHandlers();
    handlers1.close.mockImplementation(() => handle1.removeBottomSheetFromQueue());

    act(() => {
      handle1 = result.current.addBottomSheetToQueue(handlers1, false);
    });

    act(() => {
      result.current.addBottomSheetToQueue(handlers2, true);
    });

    expect(handlers1.close).toHaveBeenCalledTimes(1);
    expect(handlers2.open).toHaveBeenCalledTimes(1);
  });

  it("closeAllBottomSheets closes every drawer and empties the queue", () => {
    const { result } = renderQueue();
    const handlers1 = createHandlers();
    const handlers2 = createHandlers();

    act(() => {
      result.current.addBottomSheetToQueue(handlers1, false);
    });
    act(() => {
      result.current.addBottomSheetToQueue(handlers2, false);
    });

    act(() => {
      result.current.closeAllBottomSheets();
    });

    expect(handlers1.close).toHaveBeenCalledTimes(1);
    expect(handlers2.close).toHaveBeenCalledTimes(1);

    const handlers3 = createHandlers();
    act(() => {
      result.current.addBottomSheetToQueue(handlers3, false);
    });
    expect(handlers3.open).toHaveBeenCalledTimes(1);
  });

  it("closeAllBottomSheets is a no-op on an empty queue", () => {
    const { result } = renderQueue();
    expect(() => {
      act(() => {
        result.current.closeAllBottomSheets();
      });
    }).not.toThrow();
  });

  it("_clearQueueDIRTYDONOTUSE empties the queue so the next drawer opens immediately", () => {
    const { result } = renderQueue();
    const handlers1 = createHandlers();
    const handlers2 = createHandlers();

    act(() => {
      result.current.addBottomSheetToQueue(handlers1, false);
    });
    act(() => {
      result.current._clearQueueDIRTYDONOTUSE();
    });
    act(() => {
      result.current.addBottomSheetToQueue(handlers2, false);
    });

    expect(handlers2.open).toHaveBeenCalledTimes(1);
  });

  it("invokes the injected log adapter", () => {
    const { result, log } = renderQueue();

    act(() => {
      result.current.addBottomSheetToQueue(createHandlers(), false);
    });

    expect(log).toHaveBeenCalled();
  });

  it("throws when useQueuedBottomSheetContext is used outside a provider", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useQueuedBottomSheetContext())).toThrow(
      "useQueuedBottomSheetContext must be used within a QueuedBottomSheetsProvider",
    );
    consoleError.mockRestore();
  });
});
