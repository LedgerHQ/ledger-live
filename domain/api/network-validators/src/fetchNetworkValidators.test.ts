import { configureStore } from "@reduxjs/toolkit";
import { NetworkIdSchema, type NetworkId } from "@domain/entity-account-descriptor";
import networkValidators, { selectNetworkValidatorsEntry } from "@domain/entity-network-validators";
import type { NetworkValidator } from "@domain/entity-network-validators";
import { mockNetworkValidator } from "@domain/entity-network-validators/schema.mock";
import { networkValidatorsExtra } from "./extra";
import { fetchNetworkValidators } from "./fetchNetworkValidators";
import type { NetworkValidatorsSource } from "./source";

const cosmos = NetworkIdSchema.parse("cosmos");
const validators = [mockNetworkValidator()];

const makeStore = (
  sources: readonly NetworkValidatorsSource[],
  extra: object = networkValidatorsExtra(sources),
) =>
  configureStore({
    reducer: { networkValidators },
    middleware: getDefault => getDefault({ thunk: { extraArgument: extra } }),
  });

const source = (
  id: string,
  read: NetworkValidatorsSource["read"],
  supports = (networkId: NetworkId) => networkId === cosmos,
): NetworkValidatorsSource => ({ id, supports, read: jest.fn(read) });

describe("fetchNetworkValidators", () => {
  it("stores the validators of the first ranked source serving the network", async () => {
    const other = source(
      "other",
      async () => [],
      () => false,
    );
    const first = source("first", async () => validators);
    const second = source("second", async () => []);
    const store = makeStore([other, first, second]);
    const result = await store.dispatch(fetchNetworkValidators(cosmos));
    expect(result.payload).toEqual({ validators, sourceId: "first" });
    expect(selectNetworkValidatorsEntry(store.getState(), cosmos)).toEqual({
      validators,
      receivedAt: expect.any(Number),
    });
    expect(other.read).not.toHaveBeenCalled();
    expect(second.read).not.toHaveBeenCalled();
  });

  it("asks the next source when one fails, or answers invalid validators", async () => {
    const failing = source("failing", async () => Promise.reject(new Error("down")));
    const invalid = source("invalid", async () => [{ ...validators[0], commission: 3 }]);
    const fallback = source("fallback", async () => validators);
    const store = makeStore([failing, invalid, fallback]);
    await store.dispatch(fetchNetworkValidators(cosmos));
    expect(selectNetworkValidatorsEntry(store.getState(), cosmos)?.validators).toEqual(validators);
  });

  it("stores the last error and keeps the stored validators when every source fails", async () => {
    const answers = [async () => validators, async () => Promise.reject(new TypeError("down"))];
    const store = makeStore([source("s", () => (answers.shift() ?? answers[0])())]);
    await store.dispatch(fetchNetworkValidators(cosmos));
    const result = await store.dispatch(fetchNetworkValidators(cosmos, { refresh: true }));
    expect(result.meta.requestStatus).toBe("rejected");
    expect(selectNetworkValidatorsEntry(store.getState(), cosmos)).toEqual({
      validators,
      receivedAt: expect.any(Number),
      error: { name: "TypeError", message: "down" },
    });
  });

  it("names NoNetworkValidatorsSourceError when no source serves the network", async () => {
    const store = makeStore([
      source(
        "s",
        async () => validators,
        () => false,
      ),
    ]);
    await store.dispatch(fetchNetworkValidators(cosmos));
    expect(selectNetworkValidatorsEntry(store.getState(), cosmos)?.error?.name).toBe(
      "NoNetworkValidatorsSourceError",
    );
  });

  it("does not read again while fresh, unless refreshed or older than maxAge", async () => {
    const s = source("s", async () => validators);
    const store = makeStore([s]);
    await store.dispatch(fetchNetworkValidators(cosmos));
    await store.dispatch(fetchNetworkValidators(cosmos));
    expect(s.read).toHaveBeenCalledTimes(1);
    await store.dispatch(fetchNetworkValidators(cosmos, { refresh: true }));
    expect(s.read).toHaveBeenCalledTimes(2);
    await store.dispatch(fetchNetworkValidators(cosmos, { maxAge: 0 }));
    expect(s.read).toHaveBeenCalledTimes(3);
  });

  it("does not start a second read while one is in flight, and a refresh's answer wins", async () => {
    const held: { resolve?: (validators: NetworkValidator[]) => void } = {};
    const slow = new Promise<NetworkValidator[]>(resolve => (held.resolve = resolve));
    const reads = [() => slow, async () => [mockNetworkValidator({ name: "new" })]];
    const s = source("s", () => (reads.shift() ?? reads[0])());
    const store = makeStore([s]);
    const first = store.dispatch(fetchNetworkValidators(cosmos));
    await store.dispatch(fetchNetworkValidators(cosmos));
    expect(s.read).toHaveBeenCalledTimes(1);
    await store.dispatch(fetchNetworkValidators(cosmos, { refresh: true }));
    held.resolve?.([mockNetworkValidator({ name: "old" })]);
    await first;
    expect(selectNetworkValidatorsEntry(store.getState(), cosmos)?.validators[0]?.name).toBe("new");
  });

  it("clears the read once aborted, neither publishing nor falling back", async () => {
    const held: { resolve?: (validators: NetworkValidator[]) => void } = {};
    const ignoresSignal = source(
      "ignoresSignal",
      () => new Promise<NetworkValidator[]>(resolve => (held.resolve = resolve)),
    );
    const fallback = source("fallback", async () => validators);
    const store = makeStore([ignoresSignal, fallback]);
    const read = store.dispatch(fetchNetworkValidators(cosmos));
    read.abort();
    expect(selectNetworkValidatorsEntry(store.getState(), cosmos)?.pending).toBeUndefined();
    held.resolve?.(validators);
    const result = await read;
    expect(result.meta.requestStatus).toBe("rejected");
    expect(fallback.read).not.toHaveBeenCalled();
    expect(selectNetworkValidatorsEntry(store.getState(), cosmos)).toEqual({ validators: [] });
  });

  it("rejects when the app did not inject the sources", async () => {
    const store = makeStore([], {});
    const result = await store.dispatch(fetchNetworkValidators(cosmos));
    expect(result.meta.requestStatus).toBe("rejected");
    expect("error" in result && result.error.name).toBe("NetworkValidatorsSourcesMissingError");
  });
});
