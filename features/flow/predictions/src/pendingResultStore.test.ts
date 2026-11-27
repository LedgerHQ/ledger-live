import { createPendingResultStore } from "./pendingResultStore.internals";

type Answer = "closed" | "dismissed";

const createStore = () =>
  createPendingResultStore<{ outcome: string }, Answer>({ dismissedAnswer: "dismissed" });

describe("createPendingResultStore", () => {
  it("answers every pending report with the value it's closed with", async () => {
    const store = createStore();
    const id = store.start();
    const firstReport = store.report(id, { outcome: "first" });
    const laterReport = store.report(id, { outcome: "later" });

    store.close("closed");

    await expect(firstReport).resolves.toBe("closed");
    await expect(laterReport).resolves.toBe("closed");
  });

  it("answers the dismissed value when the request is dismissed", async () => {
    const store = createStore();
    const report = store.report(store.start(), { outcome: "done" });

    store.dismiss();

    await expect(report).resolves.toBe("dismissed");
  });

  it("answers the dismissed value when a newer request replaces it", async () => {
    const store = createStore();
    const report = store.report(store.start(), { outcome: "done" });

    store.start();

    await expect(report).resolves.toBe("dismissed");
  });

  it("answers the dismissed value right away to a report for a request that isn't open", async () => {
    const store = createStore();
    const replacedId = store.start();
    store.start();

    await expect(store.report(replacedId, { outcome: "late" })).resolves.toBe("dismissed");
  });
});
