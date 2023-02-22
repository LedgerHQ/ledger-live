import { promiseAllBatched } from "./promise";
test("promiseAllBatched", async () => {
  const promisifyIdPlusOne = (a: number) => Promise.resolve(a + 1);

  const p = promiseAllBatched(5, [], promisifyIdPlusOne);
  expect(typeof p.then).toBe("function");
  expect(await p).toEqual([]);
  expect(
    await promiseAllBatched(5, [1, 2, 3, 4, 5, 6, 7, 8], promisifyIdPlusOne)
  ).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
  expect(
    await promiseAllBatched(1, [1, 2, 3, 4, 5, 6, 7, 8], promisifyIdPlusOne)
  ).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
  expect(
    await promiseAllBatched(10, [1, 2, 3, 4, 5, 6, 7, 8], promisifyIdPlusOne)
  ).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
  expect(
    await promiseAllBatched(2, Array(6).fill(0), (_, i) => Promise.resolve(i))
  ).toEqual([0, 1, 2, 3, 4, 5]);
});
