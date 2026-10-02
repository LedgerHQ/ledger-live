import { createKeyAttemptThrottle, delayAfterFailures } from "./keyAttemptThrottle";

const isTrue = (result: boolean) => result;

describe("delayAfterFailures", () => {
  it("should not delay the first five failures", () => {
    expect([0, 1, 2, 3, 4].map(delayAfterFailures)).toEqual([0, 0, 0, 0, 0]);
  });

  it("should double the delay after that, up to 30 seconds", () => {
    expect([5, 6, 7, 10, 20].map(delayAfterFailures)).toEqual([1000, 2000, 4000, 30_000, 30_000]);
  });
});

describe("createKeyAttemptThrottle", () => {
  it("should wait before an attempt once five have failed", async () => {
    const wait = jest.fn().mockResolvedValue(undefined);
    const throttle = createKeyAttemptThrottle(wait);

    for (let i = 0; i < 5; i++) await throttle(() => false, isTrue);
    expect(wait).not.toHaveBeenCalled();

    await throttle(() => false, isTrue);
    await throttle(() => false, isTrue);
    expect(wait.mock.calls).toEqual([[1000], [2000]]);
  });

  it("should count a rejected attempt as a failure and rethrow it", async () => {
    const wait = jest.fn().mockResolvedValue(undefined);
    const throttle = createKeyAttemptThrottle(wait);
    const wrongPassword = new Error("wrong password");

    for (let i = 0; i < 5; i++) {
      await expect(
        throttle(
          () => Promise.reject(wrongPassword),
          () => true,
        ),
      ).rejects.toBe(wrongPassword);
    }
    await throttle(() => true, isTrue);

    expect(wait).toHaveBeenCalledWith(1000);
  });

  it("should reset the count after a success", async () => {
    const wait = jest.fn().mockResolvedValue(undefined);
    const throttle = createKeyAttemptThrottle(wait);

    for (let i = 0; i < 5; i++) await throttle(() => false, isTrue);
    await throttle(() => true, isTrue);
    await throttle(() => false, isTrue);

    expect(wait).toHaveBeenCalledTimes(1);
  });

  it("should run parallel attempts one at a time so they all pay the delay", async () => {
    const wait = jest.fn().mockResolvedValue(undefined);
    const throttle = createKeyAttemptThrottle(wait);

    await Promise.all(Array.from({ length: 7 }, () => throttle(() => false, isTrue)));

    expect(wait.mock.calls).toEqual([[1000], [2000]]);
  });
});
