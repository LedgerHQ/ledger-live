import { db } from "~/renderer/bridge";
import { flushPendingWrites, resetAll, setKey } from "./storage";

describe("renderer storage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.mocked(db.setKey).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("sends the debounced writes to main on flush", async () => {
    setKey("app", "ptx", { lastScreen: "swap" });
    setKey("app", "history", { lastSeenOperationDate: null });
    expect(db.setKey).not.toHaveBeenCalled();

    await flushPendingWrites();

    expect(db.setKey).toHaveBeenCalledWith("app", "ptx", { lastScreen: "swap" });
    expect(db.setKey).toHaveBeenCalledWith("app", "history", { lastSeenOperationDate: null });
  });

  it("waits until main has the write", async () => {
    let answer: (() => void) | undefined;
    jest.mocked(db.setKey).mockReturnValueOnce(new Promise<void>(resolve => (answer = resolve)));
    setKey("app", "ptx", { lastScreen: "earn" });

    let flushed = false;
    const flushing = flushPendingWrites().then(() => (flushed = true));
    await Promise.resolve();
    expect(flushed).toBe(false);

    answer?.();
    await flushing;
    expect(flushed).toBe(true);
  });

  it("flushes the writes queued while main saves the first ones", async () => {
    let answer: (() => void) | undefined;
    jest.mocked(db.setKey).mockReturnValueOnce(new Promise<void>(resolve => (answer = resolve)));
    setKey("app", "ptx", { lastScreen: "earn" });

    const flushing = flushPendingWrites();
    await Promise.resolve();
    setKey("app", "ptx", { lastScreen: "swap" });
    answer?.();
    await flushing;

    expect(db.setKey).toHaveBeenCalledTimes(2);
    expect(db.setKey).toHaveBeenLastCalledWith("app", "ptx", { lastScreen: "swap" });
  });

  it("drops the pending writes on reset", async () => {
    setKey("app", "ptx", { lastScreen: "market" });

    await resetAll();
    await flushPendingWrites();
    jest.runAllTimers();

    expect(db.setKey).not.toHaveBeenCalled();
  });
});
