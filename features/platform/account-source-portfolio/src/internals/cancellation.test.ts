import { cancelledWhenAll, orCancelled } from "./cancellation";
import { PortfolioReadCancelledError } from "./portfolio";

describe("cancelledWhenAll", () => {
  it("aborts once every signal has", () => {
    const first = new AbortController();
    const second = new AbortController();
    const { signal } = cancelledWhenAll([first.signal, second.signal]);

    first.abort();
    expect(signal?.aborted).toBe(false);

    second.abort();
    expect(signal?.aborted).toBe(true);
  });

  it("is already aborted when every signal is", () => {
    expect(cancelledWhenAll([AbortSignal.abort(), AbortSignal.abort()]).signal?.aborted).toBe(true);
  });

  it("reuses a signal every target shares", () => {
    const shared = new AbortController().signal;
    expect(cancelledWhenAll([shared, shared]).signal).toBe(shared);
  });

  it("is none when a target cannot be cancelled, or there is none", () => {
    expect(cancelledWhenAll([AbortSignal.abort(), undefined]).signal).toBeUndefined();
    expect(cancelledWhenAll([]).signal).toBeUndefined();
  });

  it("stops listening to the targets once released", () => {
    const first = new AbortController();
    const second = new AbortController();
    const { signal, release } = cancelledWhenAll([first.signal, second.signal]);

    release();
    first.abort();
    second.abort();

    expect(signal?.aborted).toBe(false);
  });
});

describe("orCancelled", () => {
  it("settles as the promise does while the signal holds", async () => {
    await expect(orCancelled(Promise.resolve(1), new AbortController().signal)).resolves.toBe(1);
  });

  it("rejects as cancelled once the signal aborts, the promise still pending", async () => {
    const cancel = new AbortController();
    const waiting = orCancelled(new Promise(() => {}), cancel.signal);

    cancel.abort();

    await expect(waiting).rejects.toBeInstanceOf(PortfolioReadCancelledError);
  });

  it("handles the failure of the promise when the signal had already aborted", async () => {
    const lookup = Promise.reject(new Error("CAL down"));
    const handled = jest.spyOn(lookup, "catch");

    await expect(orCancelled(lookup, AbortSignal.abort())).rejects.toBeInstanceOf(
      PortfolioReadCancelledError,
    );

    expect(handled).toHaveBeenCalled();
  });
});
