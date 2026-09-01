import { AccountIdSchema } from "@shared/schema-primitives";
import type { WithAccountBalances } from "./schema";
import { mockAccountBalance, mockTokenAccountBalance } from "./schema.mock";
import {
  accountBalanceSelector,
  hasAccountBalanceSelector,
  subAccountBalancesSelector,
} from "./selectors";

const main = mockAccountBalance();
const token = mockTokenAccountBalance();
const otherMainId = AccountIdSchema.parse("js:2:ethereum:0xdef:");
const orphan = mockTokenAccountBalance({
  accountId: AccountIdSchema.parse("js:2:ethereum:0xdef:+ethereum%2Ferc20%2Fdai"),
  parentId: otherMainId,
});
const unknownId = AccountIdSchema.parse("js:2:ethereum:0xzzz:");

const state: WithAccountBalances = {
  accountBalances: {
    [main.accountId]: main,
    [token.accountId]: token,
    [orphan.accountId]: orphan,
  },
};

describe("accountBalanceSelector", () => {
  it("returns the row", () => {
    expect(accountBalanceSelector(state, { accountId: main.accountId })).toEqual(main);
  });

  it("returns undefined for an account never fetched", () => {
    expect(accountBalanceSelector(state, { accountId: unknownId })).toBeUndefined();
  });
});

describe("subAccountBalancesSelector", () => {
  it("returns only the token accounts of that parent", () => {
    expect(subAccountBalancesSelector(state, { accountId: main.accountId })).toEqual([token]);
  });

  it("returns an empty list for an account with no token accounts", () => {
    expect(subAccountBalancesSelector(state, { accountId: unknownId })).toEqual([]);
  });

  it("returns the same reference for the same table", () => {
    const first = subAccountBalancesSelector(state, { accountId: main.accountId });
    expect(subAccountBalancesSelector(state, { accountId: main.accountId })).toBe(first);
  });
});

describe("hasAccountBalanceSelector", () => {
  it("reports a known balance", () => {
    expect(hasAccountBalanceSelector(state, { accountId: main.accountId })).toBe(true);
  });

  it("reports an unknown balance", () => {
    expect(hasAccountBalanceSelector(state, { accountId: unknownId })).toBe(false);
  });
});
