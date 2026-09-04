import { act, renderHook, waitFor } from "@testing-library/react";
import type { ScreenApi } from "./screenApi";
import { useScreenPolling } from "./useScreenPolling";

const A_BLOB = new Blob(["png"], { type: "image/png" });

const anApi = (overrides: Partial<ScreenApi> = {}): ScreenApi => ({
  screenshot: jest.fn().mockResolvedValue(A_BLOB),
  pressButton: jest.fn().mockResolvedValue(undefined),
  touch: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe("useScreenPolling", () => {
  let createdUrls: string[];

  beforeEach(() => {
    jest.clearAllMocks();
    createdUrls = [];
    let counter = 0;
    // jsdom implements neither of these.
    global.URL.createObjectURL = jest.fn(() => {
      const url = `blob:frame-${++counter}`;
      createdUrls.push(url);
      return url;
    });
    global.URL.revokeObjectURL = jest.fn();
  });

  it("stays idle and issues no request while polling is off", async () => {
    const api = anApi();

    const { result } = renderHook(() => useScreenPolling(api, false));

    expect(result.current).toEqual({ kind: "loading" });
    expect(api.screenshot).not.toHaveBeenCalled();
  });

  it("exposes the captured frame as an object URL", async () => {
    const api = anApi();

    const { result } = renderHook(() => useScreenPolling(api, true));

    await waitFor(() => expect(result.current.kind).toBe("image"));
    expect(result.current).toMatchObject({ kind: "image", src: "blob:frame-1" });
  });

  it("falls back to the idle state when there is nothing to capture", async () => {
    const device = { id: "device-1", name: "Ledger Stax" };
    const api = anApi({
      screenshot: jest.fn().mockResolvedValue(null),
      idle: jest.fn().mockResolvedValue({ kind: "os-info", device }),
    });

    const { result } = renderHook(() => useScreenPolling(api, true));

    await waitFor(() => expect(result.current.kind).toBe("os-info"));
    expect(result.current).toMatchObject({ kind: "os-info", device });
  });

  it("reports an error when there is nothing to capture and no idle state", async () => {
    const api = anApi({ screenshot: jest.fn().mockResolvedValue(null) });

    const { result } = renderHook(() => useScreenPolling(api, true));

    await waitFor(() => expect(result.current.kind).toBe("error"));
    expect(result.current).toMatchObject({ kind: "error", message: "No screen to capture" });
  });

  it("surfaces a failing capture as an error", async () => {
    const api = anApi({ screenshot: jest.fn().mockRejectedValue(new Error("unreachable")) });

    const { result } = renderHook(() => useScreenPolling(api, true));

    await waitFor(() => expect(result.current.kind).toBe("error"));
    expect(result.current).toMatchObject({ kind: "error", message: "unreachable" });
  });

  it("forwards input and refreshes straight after acting", async () => {
    const api = anApi();

    const { result } = renderHook(() => useScreenPolling(api, true));
    await waitFor(() => expect(result.current.kind).toBe("image"));

    const capturesBefore = (api.screenshot as jest.Mock).mock.calls.length;

    await act(async () => {
      if (result.current.kind !== "image") throw new Error("expected a frame");
      result.current.input.pressButton("left", "press");
    });

    expect(api.pressButton).toHaveBeenCalledWith("left", "press");
    await waitFor(() =>
      expect((api.screenshot as jest.Mock).mock.calls.length).toBeGreaterThan(capturesBefore),
    );
  });

  it("surfaces a failing input as an error", async () => {
    const api = anApi({ pressButton: jest.fn().mockRejectedValue(new Error("409 no instance")) });

    const { result } = renderHook(() => useScreenPolling(api, true));
    await waitFor(() => expect(result.current.kind).toBe("image"));

    await act(async () => {
      if (result.current.kind !== "image") throw new Error("expected a frame");
      result.current.input.pressButton("both", "press");
    });

    await waitFor(() => expect(result.current.kind).toBe("error"));
    expect(result.current).toMatchObject({ kind: "error", message: "409 no instance" });
  });

  it("drops the frame when polling stops, so no revoked URL is left on show", async () => {
    const api = anApi();

    const { result, rerender } = renderHook(({ polling }) => useScreenPolling(api, polling), {
      initialProps: { polling: true },
    });
    await waitFor(() => expect(result.current.kind).toBe("image"));

    rerender({ polling: false });

    expect(result.current).toEqual({ kind: "loading" });
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(createdUrls[0]);
  });

  it("revokes the outstanding object URL on unmount", async () => {
    const api = anApi();

    const { result, unmount } = renderHook(() => useScreenPolling(api, true));
    await waitFor(() => expect(result.current.kind).toBe("image"));

    unmount();

    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(createdUrls[createdUrls.length - 1]);
  });
});
