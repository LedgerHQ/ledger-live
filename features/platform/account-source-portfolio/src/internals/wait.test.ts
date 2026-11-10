import { waitUnlessAborted } from "./wait";

describe("waitUnlessAborted", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("resolves after its delay and stops listening to the signal", async () => {
    const controller = new AbortController();
    const removed = jest.spyOn(controller.signal, "removeEventListener");
    const waiting = waitUnlessAborted(3_000, controller.signal);

    jest.advanceTimersByTime(3_000);
    await waiting;

    expect(removed).toHaveBeenCalledWith("abort", expect.any(Function));
    expect(jest.getTimerCount()).toBe(0);
  });

  it("resolves as soon as the signal aborts, clearing its timer", async () => {
    const controller = new AbortController();
    const waiting = waitUnlessAborted(3_000, controller.signal);

    controller.abort();
    await waiting;

    expect(jest.getTimerCount()).toBe(0);
  });

  it("resolves at once, without a timer, when the signal has already aborted", async () => {
    await waitUnlessAborted(3_000, AbortSignal.abort());

    expect(jest.getTimerCount()).toBe(0);
  });
});
