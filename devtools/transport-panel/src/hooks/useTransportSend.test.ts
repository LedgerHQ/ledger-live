import { renderHook, act } from "@testing-library/react";
import { mockTransport } from "jest/mocks/transport";
import { useTransportSend } from "./useTransportSend";

describe("useTransportSend", () => {
  it("initialises with kind=debug, empty message and no error", () => {
    const { result } = renderHook(() => useTransportSend(mockTransport()));
    expect(result.current.kind).toBe("debug");
    expect(result.current.sendMessage).toBe("");
    expect(result.current.sendError).toBeNull();
  });

  it("updates kind via setKind", () => {
    const { result } = renderHook(() => useTransportSend(mockTransport()));
    act(() => result.current.setKind("snapshot"));
    expect(result.current.kind).toBe("snapshot");
  });

  it("updates sendMessage via setSendMessage", () => {
    const { result } = renderHook(() => useTransportSend(mockTransport()));
    act(() => result.current.setSendMessage("ping"));
    expect(result.current.sendMessage).toBe("ping");
  });

  it("calls transport.send with the current kind and message on handleSend", () => {
    const transport = mockTransport();
    const { result } = renderHook(() => useTransportSend(transport));
    act(() => result.current.setSendMessage("payload"));
    act(() => result.current.handleSend());
    expect(transport.send).toHaveBeenCalledWith("debug", "payload");
  });

  it("clears sendError after a successful send", () => {
    const transport = mockTransport();
    (transport.send as jest.Mock).mockImplementationOnce(() => {
      throw new Error("boom");
    });
    const { result } = renderHook(() => useTransportSend(transport));
    act(() => result.current.handleSend());
    expect(result.current.sendError).toBe("boom");

    act(() => result.current.handleSend());
    expect(result.current.sendError).toBeNull();
  });

  it("captures the error message when transport.send throws an Error", () => {
    const transport = mockTransport();
    (transport.send as jest.Mock).mockImplementation(() => {
      throw new Error("connection refused");
    });
    const { result } = renderHook(() => useTransportSend(transport));
    act(() => result.current.handleSend());
    expect(result.current.sendError).toBe("connection refused");
  });

  it("coerces non-Error throws to a string sendError", () => {
    const transport = mockTransport();
    (transport.send as jest.Mock).mockImplementation(() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw "raw string error";
    });
    const { result } = renderHook(() => useTransportSend(transport));
    act(() => result.current.handleSend());
    expect(result.current.sendError).toBe("raw string error");
  });
});
