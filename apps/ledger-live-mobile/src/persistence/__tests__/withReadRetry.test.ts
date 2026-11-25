import { createMemoryStorage } from "@shared/storage";
import { withReadRetry } from "../withReadRetry";

describe("withReadRetry", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("returns the value of a read that fails, then works", async () => {
    const storage = createMemoryStorage({ "accounts.active.a": { data: { id: "a" } } });
    const get = storage.get.bind(storage);
    storage.get = jest
      .fn()
      .mockRejectedValueOnce(new Error("busy"))
      .mockImplementation(key => get(key));
    const retrying = withReadRetry(storage, { retries: 3, delayMs: 500 });

    const read = retrying.get("accounts.active.a");
    await jest.advanceTimersByTimeAsync(500);

    await expect(read).resolves.toEqual({ data: { id: "a" } });
    expect(storage.get).toHaveBeenCalledTimes(2);
  });

  it("rejects with the last error after the retries", async () => {
    const storage = createMemoryStorage();
    storage.keys = jest.fn().mockRejectedValue(new Error("busy"));
    const retrying = withReadRetry(storage, { retries: 3, delayMs: 500 });

    const read = retrying.keys("accounts.active.").catch((error: unknown) => error);
    await jest.advanceTimersByTimeAsync(1500);

    expect(await read).toEqual(new Error("busy"));
    expect(storage.keys).toHaveBeenCalledTimes(4);
  });

  it("does not retry a value that is not valid JSON", async () => {
    const storage = createMemoryStorage();
    storage.get = jest.fn().mockRejectedValue(new SyntaxError("Unexpected token"));
    const retrying = withReadRetry(storage, { retries: 3, delayMs: 500 });

    await expect(retrying.get("accounts.active.a")).rejects.toThrow(SyntaxError);
    expect(storage.get).toHaveBeenCalledTimes(1);
  });

  it("does not retry the writes", async () => {
    const storage = createMemoryStorage();
    storage.set = jest.fn().mockRejectedValue(new Error("full"));
    const retrying = withReadRetry(storage, { retries: 3, delayMs: 500 });

    await expect(retrying.set("history", {})).rejects.toThrow("full");
    expect(storage.set).toHaveBeenCalledTimes(1);
  });
});
