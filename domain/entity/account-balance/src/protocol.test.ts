import { AccountIdSchema } from "@domain/entity-account";
import { accountBalanceBinding } from "./protocol";
import { mockAccountBalance } from "./schema.mock";
import { accountBalancesSlice } from "./slice";

const reducer = accountBalancesSlice.reducer;
const accountId = AccountIdSchema.parse("js:2:ethereum:0xabc:");
const row = mockAccountBalance();

describe("accountBalanceBinding", () => {
  it("is not paginated", () => {
    expect(accountBalanceBinding.selectNextQuery).toBeUndefined();
  });

  it("reads freshness from the row and pending state and source from the status", () => {
    const requested = reducer(undefined, accountBalanceBinding.requested(accountId));
    expect(accountBalanceBinding.selectPending({ accountBalances: requested }, accountId)).toBe(
      true,
    );

    const received = reducer(
      requested,
      accountBalanceBinding.received({
        accountId,
        data: [row],
        sourceId: "full-sync",
        append: false,
        at: "2026-02-01T00:00:00.000Z",
      }),
    );
    const state = { accountBalances: received };
    expect(accountBalanceBinding.selectAt(state, accountId)).toBe(Date.parse(row.at));
    expect(accountBalanceBinding.selectPending(state, accountId)).toBe(false);
    expect(accountBalanceBinding.selectSourceId(state, accountId)).toBe("full-sync");
  });
});
