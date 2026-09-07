import { useCountervaluesPolling } from "@ledgerhq/live-countervalues-react";
import React, { type ReactNode } from "react";
import { render } from "tests/testSetup";
import { CountervaluesBridgedProvider } from "./CountervaluesProvider";

jest.mock("@ledgerhq/live-countervalues-react", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues-react"),
  CountervaluesProvider: ({ children }: { children: ReactNode }) => children,
  useCountervaluesPolling: jest.fn(),
}));

jest.mock("../actions/general", () => ({
  useCalculateCountervaluesUserSettings: jest.fn(),
}));

const mockedUseCountervaluesPolling = jest.mocked(useCountervaluesPolling);
type WindowEventName = "blur" | "focus" | "online";

describe("CountervaluesBridgedProvider", () => {
  const poll = jest.fn();
  const start = jest.fn();
  const stop = jest.fn();
  let hasFocusSpy: jest.SpyInstance | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseCountervaluesPolling.mockReturnValue({
      poll,
      start,
      stop,
      wipe: jest.fn(),
      pending: false,
      error: null,
    });
  });

  afterEach(() => {
    hasFocusSpy?.mockRestore();
    hasFocusSpy = undefined;
  });

  function renderProvider() {
    return render(
      <CountervaluesBridgedProvider initialState={{ status: {} }}>
        <div />
      </CountervaluesBridgedProvider>,
    );
  }

  function dispatchWindowEvent(eventName: WindowEventName) {
    window.dispatchEvent(new Event(eventName));
  }

  it("should stop countervalue polling when the window blurs", () => {
    renderProvider();

    dispatchWindowEvent("blur");

    expect(stop).toHaveBeenCalledTimes(1);
    expect(start).not.toHaveBeenCalled();
    expect(poll).not.toHaveBeenCalled();
  });

  it("should restart and refresh countervalues when the window focuses", () => {
    renderProvider();

    dispatchWindowEvent("focus");

    expect(start).toHaveBeenCalledTimes(1);
    expect(poll).toHaveBeenCalledTimes(1);
    expect(stop).not.toHaveBeenCalled();
    expect(start.mock.invocationCallOrder[0]).toBeLessThan(poll.mock.invocationCallOrder[0]);
  });

  it("should refresh countervalues when the network returns to a focused window", () => {
    hasFocusSpy = jest.spyOn(document, "hasFocus").mockReturnValue(true);
    renderProvider();

    dispatchWindowEvent("online");

    expect(poll).toHaveBeenCalledTimes(1);
    expect(start).not.toHaveBeenCalled();
    expect(stop).not.toHaveBeenCalled();
  });

  it("should not refresh countervalues when the network returns to an unfocused window", () => {
    hasFocusSpy = jest.spyOn(document, "hasFocus").mockReturnValue(false);
    renderProvider();

    dispatchWindowEvent("online");

    expect(poll).not.toHaveBeenCalled();
    expect(start).not.toHaveBeenCalled();
    expect(stop).not.toHaveBeenCalled();
  });

  it("should remove window listeners when unmounted", () => {
    const { unmount } = renderProvider();
    unmount();

    dispatchWindowEvent("blur");
    dispatchWindowEvent("focus");
    dispatchWindowEvent("online");

    expect(stop).not.toHaveBeenCalled();
    expect(start).not.toHaveBeenCalled();
    expect(poll).not.toHaveBeenCalled();
  });
});
