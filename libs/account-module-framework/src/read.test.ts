import { drain, readScope } from "./read";

const aScope = () => {
  let stored = { value: "stale", updatedAt: 1_000 };
  return {
    refresh: jest.fn(async () => {
      stored = { value: "fresh", updatedAt: 2_000 };
    }),
    read: jest.fn(async () => stored),
  };
};

describe("readScope", () => {
  it.each([
    ["without options", undefined],
    ["without refresh", {}],
    ["with refresh false", { refresh: false }],
  ])("answers the stored value and its time %s, without refreshing", async (_, options) => {
    const scope = aScope();

    expect(await readScope(options, scope)).toEqual({ value: "stale", updatedAt: 1_000 });
    expect(scope.refresh).not.toHaveBeenCalled();
  });

  it("refreshes the scope first, and answers the refreshed value without a time: fresh", async () => {
    const scope = aScope();

    expect(await readScope({ refresh: true }, scope)).toEqual({ value: "fresh" });
    expect(scope.refresh).toHaveBeenCalledTimes(1);
  });

  it("fails as the refresh fails, reading nothing", async () => {
    const scope = aScope();
    scope.refresh.mockRejectedValue(new Error("network"));

    await expect(readScope({ refresh: true }, scope)).rejects.toThrow("network");
    expect(scope.read).not.toHaveBeenCalled();
  });
});

describe("drain", () => {
  it("runs an iterable to its end", async () => {
    const steps: number[] = [];
    await drain(
      (async function* () {
        for (const step of [1, 2, 3]) {
          steps.push(step);
          yield step;
        }
      })(),
    );
    expect(steps).toEqual([1, 2, 3]);
  });
});
