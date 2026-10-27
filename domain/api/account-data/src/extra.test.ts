import { AccountDataRouterMissingError } from "./errors";
import { addAccountDataSource, getAccountDataRuntime } from "./extra";
import { fetchAccountData } from "./fetchAccountData";
import { accountUUID, descriptor, makeStore, sourceIdOf } from "./testing";

const late = {
  id: sourceIdOf("late"),
  supports: () => true,
  read: { counter: async () => 7 },
};

describe("addAccountDataSource", () => {
  it("adds a source to the store's router, until removed", async () => {
    const store = makeStore([]);
    const remove = store.dispatch(addAccountDataSource(late));
    await store.dispatch(fetchAccountData("counter", descriptor));
    expect(store.getState().counter[accountUUID]).toBe(7);

    remove();
    await store.dispatch(fetchAccountData("counter", descriptor, { maxAge: 0 }));
    expect(store.getState().accountData.counter?.[accountUUID]?.error?.name).toBe(
      "NoAccountDataSourceError",
    );
  });

  it("throws when the app did not inject the router", () => {
    expect(() => getAccountDataRuntime({})).toThrow(AccountDataRouterMissingError);
    expect(() => addAccountDataSource(late)(undefined, undefined, {})).toThrow(
      AccountDataRouterMissingError,
    );
  });
});
