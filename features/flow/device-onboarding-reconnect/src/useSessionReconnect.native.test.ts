import { act, renderHook } from "@testing-library/react-native";
import { reconnectTimeoutMs, useSessionReconnect } from "./useSessionReconnect";

type Input = Parameters<typeof useSessionReconnect>[0];

function renderReconnect(initial: Partial<Input> = {}) {
  const connect = jest.fn();
  const input: Input = { dropped: true, error: null, connect, ...initial };
  const hook = renderHook((props: Input) => useSessionReconnect(props), { initialProps: input });
  const update = (next: Partial<Input>) => hook.rerender({ ...input, ...next });

  return { ...hook, connect, update };
}

describe("useSessionReconnect", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should report nothing while the session is up", () => {
    const { result, connect } = renderReconnect({ dropped: false });

    expect(result.current).toBeNull();
    expect(connect).not.toHaveBeenCalled();
  });

  it("should reconnect once when the session drops", () => {
    const { result, connect, update } = renderReconnect();

    update({});

    expect(result.current?.state).toBe("reconnecting");
    expect(connect).toHaveBeenCalledTimes(1);
  });

  it("should fail on a connection error", () => {
    const { result, update } = renderReconnect();

    update({ error: "BluetoothDisabled" });

    expect(result.current?.state).toBe("failed");
  });

  it("should fail when the device does not come back in time", () => {
    const { result } = renderReconnect();

    act(() => jest.advanceTimersByTime(reconnectTimeoutMs - 1));
    expect(result.current?.state).toBe("reconnecting");

    act(() => jest.advanceTimersByTime(1));
    expect(result.current?.state).toBe("failed");
  });

  it("should reconnect again and restart the wait on retry", () => {
    const { result, connect } = renderReconnect();
    act(() => jest.advanceTimersByTime(reconnectTimeoutMs));

    act(() => result.current?.retry());

    expect(connect).toHaveBeenCalledTimes(2);
    expect(result.current?.state).toBe("reconnecting");
    act(() => jest.advanceTimersByTime(reconnectTimeoutMs));
    expect(result.current?.state).toBe("failed");
  });

  it("should reconnect and wait again on the next drop", () => {
    const { result, connect, update } = renderReconnect();
    act(() => jest.advanceTimersByTime(reconnectTimeoutMs));

    update({ dropped: false });
    expect(result.current).toBeNull();
    update({ dropped: true });

    expect(result.current?.state).toBe("reconnecting");
    expect(connect).toHaveBeenCalledTimes(2);
  });
});
