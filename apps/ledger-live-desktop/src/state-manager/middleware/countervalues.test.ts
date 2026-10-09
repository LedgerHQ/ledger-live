import { createCountervaluesMiddleware } from "@features/platform-market-countervalues";
import dbMiddleware from "~/renderer/middlewares/db";
import createStore from "~/state-manager/configureStore";
import { subscribeWindowEvents } from "./countervalues";

jest.mock("@features/platform-market-countervalues", () => {
  const actual = jest.requireActual("@features/platform-market-countervalues");
  return {
    ...actual,
    createCountervaluesMiddleware: jest.fn(actual.createCountervaluesMiddleware),
  };
});

type WindowEventName = "blur" | "focus" | "online";

describe("subscribeWindowEvents", () => {
  const poll = jest.fn();
  const start = jest.fn();
  const stop = jest.fn();
  let hasFocusSpy: jest.SpyInstance | undefined;
  let unsubscribe: (() => void) | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    unsubscribe = subscribeWindowEvents({ poll, start, stop });
  });

  afterEach(() => {
    unsubscribe?.();
    hasFocusSpy?.mockRestore();
    hasFocusSpy = undefined;
  });

  function dispatchWindowEvent(eventName: WindowEventName) {
    window.dispatchEvent(new Event(eventName));
  }

  it("should stop countervalue polling when the window blurs", () => {
    dispatchWindowEvent("blur");

    expect(stop).toHaveBeenCalledTimes(1);
    expect(start).not.toHaveBeenCalled();
    expect(poll).not.toHaveBeenCalled();
  });

  it("should restart and refresh countervalues when the window focuses", () => {
    dispatchWindowEvent("focus");

    expect(start).toHaveBeenCalledTimes(1);
    expect(poll).toHaveBeenCalledTimes(1);
    expect(stop).not.toHaveBeenCalled();
    expect(start.mock.invocationCallOrder[0]).toBeLessThan(poll.mock.invocationCallOrder[0]);
  });

  it("should refresh countervalues when the network returns to a focused window", () => {
    hasFocusSpy = jest.spyOn(document, "hasFocus").mockReturnValue(true);

    dispatchWindowEvent("online");

    expect(poll).toHaveBeenCalledTimes(1);
    expect(start).not.toHaveBeenCalled();
    expect(stop).not.toHaveBeenCalled();
  });

  it("should not refresh countervalues when the network returns to an unfocused window", () => {
    hasFocusSpy = jest.spyOn(document, "hasFocus").mockReturnValue(false);

    dispatchWindowEvent("online");

    expect(poll).not.toHaveBeenCalled();
    expect(start).not.toHaveBeenCalled();
    expect(stop).not.toHaveBeenCalled();
  });

  it("should remove window listeners when unsubscribed", () => {
    unsubscribe?.();
    unsubscribe = undefined;

    dispatchWindowEvent("blur");
    dispatchWindowEvent("focus");
    dispatchWindowEvent("online");

    expect(stop).not.toHaveBeenCalled();
    expect(start).not.toHaveBeenCalled();
    expect(poll).not.toHaveBeenCalled();
  });
});

describe("the desktop store", () => {
  // Two installs would run two polling loops and fetch every pair twice, with no error.
  it("installs the countervalues middleware exactly once", () => {
    jest.mocked(createCountervaluesMiddleware).mockClear();

    createStore({ dbMiddleware, fetchRemoteFlags: null });

    expect(createCountervaluesMiddleware).toHaveBeenCalledTimes(1);
  });
});
