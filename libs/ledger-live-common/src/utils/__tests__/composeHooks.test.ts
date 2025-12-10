import { composeHooks } from "../composeHooks";

describe("composeHooks", () => {
  it("should compose hooks and merge their results", () => {
    const hook1 = (items: Array<{ id: number }>) =>
      items.map(item => ({ id: item.id, extra: item.id * 2 }));
    const hook2 = (items: Array<{ id: number; extra: number }>) =>
      items.map(item => ({ ...item, final: item.extra + 1 }));

    const composed = composeHooks(hook1, hook2);

    const input: Array<{ id: number }> = [{ id: 1 }, { id: 2 }];
    const processedInput = input.map(item => ({ id: item.id, extra: item.id * 2 }));
    const result = composed(processedInput);

    expect(result).toEqual([
      { id: 1, extra: 2, final: 3 },
      { id: 2, extra: 4, final: 5 },
    ]);
  });

  it("should handle hooks that return undefined", () => {
    const hook1 = (items: Array<{ id: number }>) =>
      items.map(item => ({ id: item.id, extra: item.id * 2 }));
    const hook2 = () => undefined;

    const composed = composeHooks(hook1, hook2);

    const input = [{ id: 1 }, { id: 2 }];
    const result = composed(input);

    expect(result).toEqual([
      { id: 1, extra: 2 },
      { id: 2, extra: 4 },
    ]);
  });

  it("should return the original items if no hooks are provided", () => {
    const composed = composeHooks();

    const input = [{ id: 1 }, { id: 2 }];
    const result = composed(input);

    expect(result).toEqual(input);
  });

  it("should return an empty array when items is an empty array", () => {
    const hook1 = (items: Array<{ id: number }>) =>
      items.map(item => ({ id: item.id, extra: item.id * 2 }));

    const composed = composeHooks(hook1);

    const result = composed([]);

    expect(result).toEqual([]);
  });
});
