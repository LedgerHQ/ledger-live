import { chunk, createLimiter } from "./limiter";

const tick = () => new Promise(resolve => setTimeout(resolve, 0));

describe("chunk", () => {
  it("splits in parts of size, the last one shorter", () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
    expect(chunk([1, 2, 3], 2)).toEqual([[1, 2], [3]]);
    expect(chunk([], 2)).toEqual([]);
  });
});

describe("createLimiter", () => {
  it("runs at most limit tasks, starts the next as one ends, and frees every slot after", async () => {
    const limit = createLimiter(2);
    let active = 0;
    let peak = 0;
    const releases: Array<() => void> = [];
    const task = () =>
      new Promise<void>(resolve => {
        peak = Math.max(peak, ++active);
        releases.push(() => {
          active--;
          resolve();
        });
      });
    const all = Promise.all([limit(task), limit(task), limit(task)]);
    await tick();
    expect(releases).toHaveLength(2);
    releases[0]();
    await tick();
    expect(releases).toHaveLength(3);
    releases[1]();
    releases[2]();
    await all;
    expect(peak).toBe(2);
    const again = Promise.all([limit(task), limit(task)]);
    await tick();
    expect(releases).toHaveLength(5);
    releases[3]();
    releases[4]();
    await again;
  });

  it("frees the slot of a task that throws", async () => {
    const limit = createLimiter(1);
    await expect(limit(async () => Promise.reject(new Error("down")))).rejects.toThrow("down");
    await expect(limit(async () => 1)).resolves.toBe(1);
  });
});
