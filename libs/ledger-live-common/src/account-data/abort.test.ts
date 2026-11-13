import { NEVER, Observable, of, throwError } from "rxjs";
import { lastValueUntilAborted } from "./abort";

describe("lastValueUntilAborted", () => {
  it("resolves the last value, or the default one when none is emitted", async () => {
    await expect(lastValueUntilAborted(of(1, 2, 3), undefined)).resolves.toBe(3);
    await expect(lastValueUntilAborted(of<number>(), undefined, 7)).resolves.toBe(7);
    await expect(lastValueUntilAborted(of<number>(), undefined)).rejects.toThrow(
      "completed without a value",
    );
  });

  it("forwards the observable's error", async () => {
    await expect(
      lastValueUntilAborted(
        throwError(() => new Error("x")),
        undefined,
      ),
    ).rejects.toThrow("x");
  });

  it("unsubscribes and rejects once the signal aborts", async () => {
    const teardown = jest.fn();
    const controller = new AbortController();
    const pending = lastValueUntilAborted(new Observable(() => teardown), controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(teardown).toHaveBeenCalled();
  });

  it("unsubscribes a source that aborts the signal while it subscribes", async () => {
    const teardown = jest.fn();
    const controller = new AbortController();
    const pending = lastValueUntilAborted(
      new Observable(() => {
        controller.abort();
        return teardown;
      }),
      controller.signal,
    );
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(teardown).toHaveBeenCalled();
  });

  it("never subscribes with an already aborted signal", async () => {
    const subscribe = jest.fn();
    const controller = new AbortController();
    controller.abort(new Error("stopped"));
    await expect(
      lastValueUntilAborted(new Observable(subscribe), controller.signal),
    ).rejects.toThrow("stopped");
    expect(subscribe).not.toHaveBeenCalled();
    await expect(lastValueUntilAborted(NEVER, controller.signal)).rejects.toThrow("stopped");
  });
});
