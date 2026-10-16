import { createMemoryHistoryStore } from "./history";
import { DEFAULT_OPTIMISTIC_EXPIRY_MS, settleOptimisticOperations } from "./pending";
import { anOperation } from "./test-utils";

const NOW = Date.parse("2026-01-01T12:00:00.000Z");
const optimistic = (id: string, ageMs = 0) =>
  anOperation({ id, hash: id, block: null, optimistic: true, date: new Date(NOW - ageMs) });

describe("settleOptimisticOperations", () => {
  it("removes the optimistic operations synced, expired or settled by the module rule", async () => {
    const store = createMemoryHistoryStore([
      anOperation({ id: "synced", hash: "sent" }),
      optimistic("sent"),
      optimistic("old", DEFAULT_OPTIMISTIC_EXPIRY_MS + 1),
      optimistic("replaced"),
      optimistic("waiting"),
    ]);
    await settleOptimisticOperations(store, {
      now: NOW,
      isSettled: (op, synced) => op.id === "replaced" && synced.length === 1,
    });
    expect(
      store
        .snapshot()
        .map(op => op.id)
        .sort(),
    ).toEqual(["synced", "waiting"]);
  });

  it("does nothing without optimistic operations, and keeps them by default", async () => {
    const store = createMemoryHistoryStore([anOperation()]);
    const remove = jest.spyOn(store, "remove");
    await settleOptimisticOperations(store);
    expect(remove).not.toHaveBeenCalled();

    const fresh = createMemoryHistoryStore([
      anOperation({ id: "now", hash: "now", block: null, optimistic: true, date: new Date() }),
    ]);
    await settleOptimisticOperations(fresh);
    expect(fresh.snapshot()).toHaveLength(1);
  });
});
