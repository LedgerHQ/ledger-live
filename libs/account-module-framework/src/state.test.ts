import { createMemoryStateStore } from "./state";

describe("createMemoryStateStore", () => {
  it("starts with the initial state, then keeps the last one put", async () => {
    const store = createMemoryStateStore<string>({ version: 1, data: "first" });
    expect(await store.get()).toEqual({ version: 1, data: "first" });

    await store.put({ version: 2, data: "second" });

    expect(await store.get()).toEqual({ version: 2, data: "second" });
    expect(store.snapshot()).toEqual({ version: 2, data: "second" });
  });

  it("starts empty", async () => {
    const store = createMemoryStateStore();
    expect(await store.get()).toBeUndefined();
    expect(store.snapshot()).toBeUndefined();
  });
});
