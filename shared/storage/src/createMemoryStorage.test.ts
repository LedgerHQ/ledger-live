import { createMemoryStorage } from "./createMemoryStorage";
import { describeStorageContract } from "./testing";

describeStorageContract("memory", () => createMemoryStorage());

describe("createMemoryStorage", () => {
  it("starts with the initial values", async () => {
    const storage = createMemoryStorage({ history: { lastSeenOperationDate: null } });
    await expect(storage.get("history")).resolves.toEqual({ lastSeenOperationDate: null });
  });

  it("does not share objects with the caller", async () => {
    const storage = createMemoryStorage();
    const value = { a: 1 };
    await storage.set("key", value);
    value.a = 2;
    const read = await storage.get("key");
    expect(read).toEqual({ a: 1 });
  });
});
