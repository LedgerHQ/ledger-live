import { cancelledWhenAll } from "./cancellation";

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
