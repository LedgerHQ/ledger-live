import { configureStore } from "@reduxjs/toolkit";
import { accountOperationsSlice } from "@domain/entity-account-operations";
import { mockAccountOperation } from "@domain/entity-account-operations/schema.mock";
import { DateTimeIsoSchema } from "@shared/schema-primitives";
import {
  createAccountDataRouter,
  type AccountDataSource,
  type AccountRef,
} from "@features/platform-account-data";
import { fetchAccountOperations, fetchMoreAccountOperations } from ".";

const ref = {
  accountId: "js:2:ethereum:0xabc:",
  currencyId: "ethereum",
  address: "0xabc",
  derivationMode: "",
} as AccountRef;

const makeStore = () =>
  configureStore({ reducer: { accountOperations: accountOperationsSlice.reducer } });

const routerOf = (methods: Partial<AccountDataSource>) =>
  createAccountDataRouter([{ id: "fake", supports: () => true, ...methods }]);

describe("fetchAccountOperations", () => {
  it("loads the head, then appends the next page from the stored cursor", async () => {
    const store = makeStore();
    const getOperations = jest
      .fn()
      .mockResolvedValueOnce({
        operations: [mockAccountOperation({ id: "op-1" })],
        nextCursor: "c1",
        complete: false,
      })
      .mockResolvedValueOnce({
        operations: [
          mockAccountOperation({
            id: "op-2",
            date: DateTimeIsoSchema.parse("2026-01-30T12:00:00.000Z"),
          }),
        ],
        complete: true,
      });
    const router = routerOf({ getOperations });

    await store.dispatch(fetchAccountOperations(router, ref));
    await store.dispatch(fetchMoreAccountOperations(router, ref));

    expect(getOperations).toHaveBeenNthCalledWith(2, ref, { cursor: "c1", limit: 50 }, undefined);
    const entry = store.getState().accountOperations.byAccount[ref.accountId];
    expect(entry?.operations.map(op => op.id)).toEqual(["op-1", "op-2"]);
    expect(entry?.complete).toBe(true);
  });

  it("does nothing to load more without a cursor", async () => {
    const store = makeStore();
    const getOperations = jest.fn();
    await store.dispatch(fetchMoreAccountOperations(routerOf({ getOperations }), ref));
    expect(getOperations).not.toHaveBeenCalled();
  });
});
