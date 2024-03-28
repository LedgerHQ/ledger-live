import { promiseAllBatched, retry } from "./promise";

describe("promise", () => {
  test("promiseAllBatched", async () => {
    const promisifyIdPlusOne = (a: number) => Promise.resolve(a + 1);

    const p = promiseAllBatched(5, [], promisifyIdPlusOne);
    expect(typeof p.then).toBe("function");
    expect(await p).toEqual([]);
    expect(await promiseAllBatched(5, [1, 2, 3, 4, 5, 6, 7, 8], promisifyIdPlusOne)).toEqual([
      2, 3, 4, 5, 6, 7, 8, 9,
    ]);
    expect(await promiseAllBatched(1, [1, 2, 3, 4, 5, 6, 7, 8], promisifyIdPlusOne)).toEqual([
      2, 3, 4, 5, 6, 7, 8, 9,
    ]);
    expect(await promiseAllBatched(10, [1, 2, 3, 4, 5, 6, 7, 8], promisifyIdPlusOne)).toEqual([
      2, 3, 4, 5, 6, 7, 8, 9,
    ]);
    expect(await promiseAllBatched(2, Array(6).fill(0), (_, i) => Promise.resolve(i))).toEqual([
      0, 1, 2, 3, 4, 5,
    ]);
  });
  describe("promise retries", () => {
    test("should retry by default", async () => {
      let numberOfExecutions = 0;
      const testFunction = () => Promise.reject(numberOfExecutions++);
      try {
        await retry(() => testFunction(), {
          maxRetry: 5,
        });
      } catch (e) {
        expect(e).toBe(5);
      }
      expect(numberOfExecutions).toBe(6);
    });

    test("should retry when retryCondition is passed", async () => {
      let numberOfExecutions = 0;
      const testFunction = () => Promise.reject(numberOfExecutions++);
      try {
        await retry(() => testFunction(), {
          maxRetry: 5,
          retryCondition: _ => {
            return true;
          },
        });
      } catch (e) {
        expect(e).toBe(5);
      }
      expect(numberOfExecutions).toBe(6);
    });

    test("should not retry when retryCondition returns false", async () => {
      let numberOfExecutions = 0;
      const testFunction = () => Promise.reject(numberOfExecutions++);
      try {
        await retry(() => testFunction(), {
          maxRetry: 5,
          retryCondition: e => {
            expect(e).toBe(0);
            return false;
          },
        });
      } catch (e) {
        expect(e).toBe(0);
      }
      expect(numberOfExecutions).toBe(1);
    });
  });
});
