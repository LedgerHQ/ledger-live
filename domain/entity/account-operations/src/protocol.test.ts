import { AccountIdSchema } from "@domain/entity-account";
import { accountOperationsBinding } from "./protocol";
import { mockAccountOperation } from "./schema.mock";
import { accountOperationsSlice } from "./slice";

const reducer = accountOperationsSlice.reducer;
const accountId = AccountIdSchema.parse("js:2:ethereum:0xabc:");
const at = "2026-01-31T13:00:00.000Z";

const received = (nextCursor?: string) =>
  accountOperationsBinding.received({
    accountId,
    data: { operations: [mockAccountOperation()], complete: nextCursor === undefined, nextCursor },
    sourceId: "granular",
    append: false,
    at,
  });

const root = (action: ReturnType<typeof received>) => ({
  accountOperations: reducer(undefined, action),
});

describe("accountOperationsBinding", () => {
  it("asks for the next page from the stored cursor", () => {
    expect(accountOperationsBinding.selectNextQuery?.(root(received("c1")), accountId)).toEqual({
      cursor: "c1",
    });
  });

  it("asks for nothing once the history is complete", () => {
    expect(accountOperationsBinding.selectNextQuery?.(root(received()), accountId)).toBeUndefined();
  });

  it("reads freshness, pending state and source from the slice", () => {
    const state = root(received());
    expect(accountOperationsBinding.selectAt(state, accountId)).toBe(Date.parse(at));
    expect(accountOperationsBinding.selectPending(state, accountId)).toBe(false);
    expect(accountOperationsBinding.selectSourceId(state, accountId)).toBe("granular");
  });
});
