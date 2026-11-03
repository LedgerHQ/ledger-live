import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { ETH, evm } from "./fakeService.mock";
import {
  EMPTY_SNAPSHOT,
  createPortfolioStore,
  createSnapshotStore,
  withActivity,
  withListing,
  withOutcomes,
} from "./snapshot";

const outcome = { status: "served", rows: 1, at: 1 } as const;

describe("snapshot updates", () => {
  it("sets the listing with its time", () => {
    expect(withListing(EMPTY_SNAPSHOT, { id: "p" }, 5).listing).toEqual({
      portfolio: { id: "p" },
      at: 5,
    });
  });

  it("merges outcomes, the newest winning", () => {
    const eth = computeAccountUUID(ETH);
    const other = computeAccountUUID(evm(2));
    const first = withOutcomes(EMPTY_SNAPSHOT, [[eth, outcome]]);
    const next = withOutcomes(first, [
      [other, outcome],
      [eth, { ...outcome, status: "failed" }],
    ]);
    expect(next.outcomes).toEqual({ [eth]: { ...outcome, status: "failed" }, [other]: outcome });
    expect(first.outcomes).toEqual({ [eth]: outcome });
  });

  it("numbers the activity and keeps the last 200 entries", () => {
    let snapshot = EMPTY_SNAPSHOT;
    for (let index = 0; index < 205; index += 1) {
      snapshot = withActivity(snapshot, { at: index, ok: true, summary: `${index}` });
    }
    expect(snapshot.activity).toHaveLength(200);
    expect(snapshot.activity[0]).toEqual({ id: 5, at: 5, ok: true, summary: "5" });
    expect(snapshot.activity.at(-1)?.id).toBe(204);
  });
});

describe("createSnapshotStore", () => {
  it("returns the same object until set, then notifies until unsubscribed", () => {
    const store = createSnapshotStore({ value: 1 });
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);
    expect(store.get()).toBe(store.get());

    const next = { value: 2 };
    store.set(next);
    expect(store.get()).toBe(next);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.set({ value: 3 });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("createPortfolioStore", () => {
  it("stays busy while any tracked task runs, a failed one included", async () => {
    const store = createPortfolioStore();
    const pending: (() => void)[] = [];
    const slow = store.track(() => new Promise<void>(resolve => pending.push(resolve)));
    const failing = store.track(() => Promise.reject(new Error("boom")));

    await expect(failing).rejects.toThrow("boom");
    expect(store.get().busy).toBe(true);

    pending.forEach(resolve => resolve());
    await slow;
    expect(store.get().busy).toBe(false);
  });
});
