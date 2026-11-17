import { db } from "~/renderer/bridge";
import { flushPendingWrites, resetAll, setKey } from "./storage";

function blockNextMainWrite(): () => void {
  let answer: (() => void) | undefined;
  jest.mocked(db.setKey).mockReturnValueOnce(new Promise<void>(resolve => (answer = resolve)));
  return () => answer?.();
}

describe("renderer storage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.mocked(db.setKey).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("holds a write for the debounce delay", async () => {
    setKey("app", "ptx", { lastScreen: "swap" });

    await jest.advanceTimersByTimeAsync(999);
    expect(db.setKey).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(1);
    expect(db.setKey).toHaveBeenCalledWith("app", "ptx", { lastScreen: "swap" });
  });

  it("sends the debounced writes to main on flush", async () => {
    setKey("app", "ptx", { lastScreen: "swap" });
    setKey("app", "history", { lastSeenOperationDate: null });
    expect(db.setKey).not.toHaveBeenCalled();

    await flushPendingWrites();

    expect(db.setKey).toHaveBeenCalledWith("app", "ptx", { lastScreen: "swap" });
    expect(db.setKey).toHaveBeenCalledWith("app", "history", { lastSeenOperationDate: null });
  });

  it("waits on flush until main has the write", async () => {
    const answer = blockNextMainWrite();
    setKey("app", "ptx", { lastScreen: "earn" });

    let flushed = false;
    const flushing = flushPendingWrites().then(() => (flushed = true));
    await Promise.resolve();
    expect(flushed).toBe(false);

    answer();
    await flushing;
    expect(flushed).toBe(true);
  });

  it("flushes the writes queued while main saves the first ones", async () => {
    const answer = blockNextMainWrite();
    setKey("app", "ptx", { lastScreen: "earn" });

    const flushing = flushPendingWrites();
    await Promise.resolve();
    setKey("app", "ptx", { lastScreen: "swap" });
    answer();
    await flushing;

    expect(db.setKey).toHaveBeenCalledTimes(2);
    expect(db.setKey).toHaveBeenLastCalledWith("app", "ptx", { lastScreen: "swap" });
  });

  it("sends the writes of a key to main in order", async () => {
    const answer = blockNextMainWrite();
    setKey("app", "ptx", { lastScreen: "earn" });
    const first = flushPendingWrites();
    await Promise.resolve();

    setKey("app", "ptx", { lastScreen: "swap" });
    const second = flushPendingWrites();
    await Promise.resolve();
    expect(db.setKey).toHaveBeenCalledTimes(1);

    answer();
    await Promise.all([first, second]);
    expect(db.setKey).toHaveBeenCalledTimes(2);
    expect(db.setKey).toHaveBeenLastCalledWith("app", "ptx", { lastScreen: "swap" });
  });

  it("drops the pending writes on reset", async () => {
    setKey("app", "ptx", { lastScreen: "market" });

    await resetAll();
    await flushPendingWrites();
    await jest.runAllTimersAsync();

    expect(db.setKey).not.toHaveBeenCalled();
  });

  it("drops on reset a write queued behind a blocked write", async () => {
    const answer = blockNextMainWrite();
    setKey("app", "ptx", { lastScreen: "earn" });
    void flushPendingWrites();
    await Promise.resolve();
    setKey("app", "ptx", { lastScreen: "swap" });
    await jest.runAllTimersAsync();

    await resetAll();
    answer();
    await flushPendingWrites();
    await jest.runAllTimersAsync();

    expect(db.setKey).toHaveBeenCalledTimes(1);
    expect(db.setKey).toHaveBeenCalledWith("app", "ptx", { lastScreen: "earn" });
  });
});
