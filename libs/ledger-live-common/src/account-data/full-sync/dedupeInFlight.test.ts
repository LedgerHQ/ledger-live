import { dedupeInFlight } from "./dedupeInFlight";

function deferred<V>() {
  const handle: { resolve?: (value: V) => void } = {};
  const promise = new Promise<V>(resolve => {
    handle.resolve = resolve;
  });
  return { promise, resolve: (value: V) => handle.resolve?.(value) };
}

describe("dedupeInFlight", () => {
  it("shares the call in flight between callers of one key", async () => {
    const shared = dedupeInFlight<string, number>();
    const call = deferred<number>();
    const run = jest.fn(() => call.promise);
    const both = Promise.all([shared("a", run), shared("a", run)]);
    call.resolve(1);
    await expect(both).resolves.toEqual([1, 1]);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("runs each key on its own", async () => {
    const shared = dedupeInFlight<string, string>();
    const run = jest.fn(async () => "done");
    await Promise.all([shared("a", run), shared("b", run)]);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("runs again once the call settled", async () => {
    const shared = dedupeInFlight<string, string>();
    const run = jest.fn(async () => "done");
    await shared("a", run);
    await shared("a", run);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("runs again after a failed call", async () => {
    const shared = dedupeInFlight<string, string>();
    const run = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce("done");
    await expect(shared("a", run)).rejects.toThrow("network");
    await expect(shared("a", run)).resolves.toBe("done");
  });
});
