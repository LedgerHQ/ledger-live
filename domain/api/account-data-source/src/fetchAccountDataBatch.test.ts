import { AccountRefSchema, type AccountRef } from "@domain/entity-account";
import { counterBinding, makeStore } from "./testing/toyData";
import { fetchAccountData, fetchAccountDataBatch } from "./fetchAccountData";
import type { AccountDataSource } from "./source";

const refOf = (index: number, address = `0x${index}`): AccountRef =>
  AccountRefSchema.parse({
    accountId: `js:2:ethereum:0x${index}:`,
    currencyId: "ethereum",
    address,
    derivationMode: "",
  });

const indexOf = (ref: AccountRef) => Number(ref.accountId.split(":")[3].slice(2));

function batchSource(
  answer: (ref: AccountRef) => PromiseSettledResult<number> = ref => ({
    status: "fulfilled",
    value: indexOf(ref),
  }),
) {
  const calls: AccountRef[][] = [];
  const source: AccountDataSource = {
    id: "batch",
    supports: () => true,
    batch: {
      counter: async refs => {
        calls.push([...refs]);
        return refs.map(answer);
      },
    },
  };
  return { source, calls };
}

describe("fetchAccountDataBatch", () => {
  it("stores every answer in one source call", async () => {
    const { source, calls } = batchSource();
    const store = makeStore([source]);
    await store.dispatch(fetchAccountDataBatch(counterBinding, [refOf(0), refOf(1), refOf(2)]));
    expect(calls).toHaveLength(1);
    const { byAccount, status } = store.getState().counter;
    expect([0, 1, 2].map(index => byAccount[refOf(index).accountId]?.value)).toEqual([0, 1, 2]);
    expect(status[refOf(1).accountId]).toEqual({ pending: false, sourceId: "batch" });
  });

  it("records each failure on its own account", async () => {
    const { source } = batchSource(ref =>
      indexOf(ref) === 1
        ? { status: "rejected", reason: new Error("unknown address") }
        : { status: "fulfilled", value: indexOf(ref) },
    );
    const store = makeStore([source]);
    await store.dispatch(fetchAccountDataBatch(counterBinding, [refOf(0), refOf(1)]));
    const { byAccount, status } = store.getState().counter;
    expect(byAccount[refOf(0).accountId]?.value).toBe(0);
    expect(status[refOf(1).accountId]?.error).toBe("unknown address");
  });

  it("reads only the accounts that are not fresh", async () => {
    const { source, calls } = batchSource();
    const store = makeStore([source]);
    await store.dispatch(fetchAccountDataBatch(counterBinding, [refOf(0)]));
    await store.dispatch(fetchAccountDataBatch(counterBinding, [refOf(0), refOf(1)]));
    expect(calls).toEqual([[refOf(0)], [refOf(1)]]);
  });

  it("does nothing when every account is fresh", async () => {
    const { source, calls } = batchSource();
    const store = makeStore([source]);
    await store.dispatch(fetchAccountDataBatch(counterBinding, [refOf(0)]));
    await store.dispatch(fetchAccountDataBatch(counterBinding, [refOf(0)]));
    expect(calls).toHaveLength(1);
  });

  it("reads an account listed twice once, under its last ref", async () => {
    const { source, calls } = batchSource();
    const store = makeStore([source]);
    await store.dispatch(fetchAccountDataBatch(counterBinding, [refOf(0), refOf(0, "0xrotated")]));
    expect(calls).toEqual([[refOf(0, "0xrotated")]]);
  });

  it("is joined by a single read of an account it is already reading", async () => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => (release = resolve));
    const counter = jest.fn(async (ref: AccountRef) => {
      await gate;
      return indexOf(ref);
    });
    const store = makeStore([{ id: "s", supports: () => true, counter }]);
    const batch = store.dispatch(fetchAccountDataBatch(counterBinding, [refOf(0), refOf(1)]));
    const single = store.dispatch(fetchAccountData(counterBinding, refOf(1)));
    release();
    await Promise.all([batch, single]);
    expect(counter).toHaveBeenCalledTimes(2);
  });

  it("fails every account when the app forgot to inject the router", async () => {
    const store = makeStore([], {});
    await store.dispatch(fetchAccountDataBatch(counterBinding, [refOf(0), refOf(1)]));
    const { status } = store.getState().counter;
    expect(status[refOf(0).accountId]?.error).toMatch(/No account data router/);
    expect(status[refOf(1).accountId]?.error).toMatch(/No account data router/);
  });
});

describe("single reads dispatched together", () => {
  it("reach a batch source as one call", async () => {
    const { source, calls } = batchSource();
    const store = makeStore([source]);
    await Promise.all(
      [0, 1, 2].map(index => store.dispatch(fetchAccountData(counterBinding, refOf(index)))),
    );
    expect(calls).toHaveLength(1);
    expect(calls[0]).toHaveLength(3);
  });
});
