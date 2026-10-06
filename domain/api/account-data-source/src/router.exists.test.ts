import { accountId, descriptor } from "./testing/toyData";
import { NoAccountSourceError } from "./errors";
import { createAccountDataRouter } from "./router";

describe("createAccountDataRouter exists", () => {
  it("asks the first source that has exists and supports the account", async () => {
    const router = createAccountDataRouter([
      { id: "readers-only", supports: () => true, counter: async () => 1 },
      { id: "no", supports: () => true, supportsExists: () => false, exists: async () => true },
      { id: "yes", supports: () => true, exists: async () => false },
    ]);
    expect(await router.exists(descriptor)).toEqual({ exists: false, sourceId: "yes" });
  });

  it("hands the predicate the account id and the descriptor", async () => {
    const exists = jest.fn(async () => true);
    const router = createAccountDataRouter([{ id: "a", supports: () => true, exists }]);
    await router.exists(descriptor);
    expect(exists).toHaveBeenCalledWith({ accountId, descriptor }, undefined);
  });

  it("throws NoAccountSourceError when no source can say", async () => {
    const router = createAccountDataRouter([{ id: "a", supports: () => true }]);
    await expect(router.exists(descriptor)).rejects.toBeInstanceOf(NoAccountSourceError);
  });

  it("only asks the pinned source", async () => {
    const router = createAccountDataRouter([
      { id: "first", supports: () => true, exists: async () => true },
      { id: "second", supports: () => true, exists: async () => false },
    ]);
    expect(await router.exists(descriptor, { sourceId: "second" })).toEqual({
      exists: false,
      sourceId: "second",
    });
  });

  it("rejects without asking when already aborted", async () => {
    const exists = jest.fn(async () => true);
    const router = createAccountDataRouter([{ id: "a", supports: () => true, exists }]);
    const controller = new AbortController();
    controller.abort();
    await expect(router.exists(descriptor, { signal: controller.signal })).rejects.toThrow();
    expect(exists).not.toHaveBeenCalled();
  });
});
