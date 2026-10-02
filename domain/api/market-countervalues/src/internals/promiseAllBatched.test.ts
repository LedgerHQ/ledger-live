import { promiseAllBatched } from "./promiseAllBatched";

test("resolves in input order regardless of completion order", async () => {
  const delays = [30, 0, 20, 10];
  const out = await promiseAllBatched(
    2,
    delays,
    (ms, i) => new Promise<number>(resolve => setTimeout(() => resolve(i), ms)),
  );
  expect(out).toEqual([0, 1, 2, 3]);
});

test("never runs more than `batch` at once", async () => {
  let inFlight = 0;
  let peak = 0;
  await promiseAllBatched(
    3,
    Array.from({ length: 20 }, (_, i) => i),
    async () => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise(resolve => setTimeout(resolve, 1));
      inFlight--;
    },
  );
  expect(peak).toBe(3);
});

test("handles an empty list", async () => {
  expect(await promiseAllBatched(4, [], async () => 1)).toEqual([]);
});

test("handles a batch larger than the list", async () => {
  expect(await promiseAllBatched(10, [1, 2], async n => n * 2)).toEqual([2, 4]);
});

test("rejects if any item rejects", async () => {
  await expect(
    promiseAllBatched(2, [1, 2, 3], async n => {
      if (n === 2) throw new Error("boom");
      return n;
    }),
  ).rejects.toThrow("boom");
});
