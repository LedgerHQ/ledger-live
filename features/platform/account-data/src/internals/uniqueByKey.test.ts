import { descriptorOf } from "@domain/api-account-data/testing";
import { uniqueByKey } from "./uniqueByKey";

describe("uniqueByKey", () => {
  it("keeps the first descriptor of each account, in order", () => {
    const [a, b] = [descriptorOf(0), descriptorOf(1)];
    const copy = { ...a };
    expect([...uniqueByKey([b, a, copy]).values()]).toEqual([b, a]);
    expect([...uniqueByKey([b, a, copy]).values()][1]).toBe(a);
  });

  it("is empty for no descriptors", () => {
    expect(uniqueByKey([]).size).toBe(0);
  });
});
