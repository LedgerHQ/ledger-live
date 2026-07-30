import { renderHook, act } from "@testing-library/react";
import type { ConnectionStatus } from "@devtools/transport";
import { mockTransport } from "jest/mocks/transport";
import { useTransportState } from "./useTransportState";

describe("useTransportState", () => {
  it("returns the current transport state on mount", () => {
    const transport = mockTransport({ status: "connecting", url: "ws://hub" });
    const { result } = renderHook(() => useTransportState(transport));
    expect(result.current.status).toBe("connecting");
    expect(result.current.url).toBe("ws://hub");
  });

  it("calls transport.subscribe on mount", () => {
    const transport = mockTransport();
    renderHook(() => useTransportState(transport));
    expect(transport.subscribe).toHaveBeenCalledTimes(1);
  });

  it("calls the returned unsubscribe function on unmount", () => {
    const unsubscribe = jest.fn();
    const transport = mockTransport();
    (transport.subscribe as jest.Mock).mockReturnValue(unsubscribe);
    const { unmount } = renderHook(() => useTransportState(transport));
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("reflects updated state when a subscriber notification fires", () => {
    let listener: (() => void) | undefined;
    let state: { status: ConnectionStatus; url: string; origin: string; history: never[] } = {
      status: "open",
      url: "ws://a",
      origin: "local",
      history: [],
    };

    const transport = {
      getState: () => state,
      subscribe: jest.fn((cb: () => void) => {
        listener = cb;
        return jest.fn();
      }),
      setUrl: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      send: jest.fn(),
    };

    const { result } = renderHook(() => useTransportState(transport));
    expect(result.current.status).toBe("open");

    act(() => {
      state = { ...state, status: "closed" };
      listener?.();
    });

    expect(result.current.status).toBe("closed");
  });
});
