import { parseAnyAccountId } from "@shared/schema-primitives";
import { computeAccountAlias, initialAccountAliasState } from "./schema";
import { accountAliasSlice, registerAccountAliases } from "./slice";

const { reducer } = accountAliasSlice;

const ACCOUNT_ID = "js:2:bitcoin:xpub6DEHKg8fgKcb5iYGPLtpBYD9gm7nvym3wwhH:segwit";
const TOKEN_ACCOUNT_ID = "js:2:ethereum:0xdead:+ethereum/erc20/usd__coin";
const accountId = parseAnyAccountId(ACCOUNT_ID);
const tokenAccountId = parseAnyAccountId(TOKEN_ACCOUNT_ID);

describe("accountAliasSlice", () => {
  it("starts empty", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual(initialAccountAliasState);
  });

  it("registers aliases for main and token accounts", () => {
    const state = reducer(undefined, registerAccountAliases([ACCOUNT_ID, TOKEN_ACCOUNT_ID]));
    expect(state.accountIdByAlias).toEqual({
      [computeAccountAlias(accountId)]: ACCOUNT_ID,
      [computeAccountAlias(tokenAccountId)]: TOKEN_ACCOUNT_ID,
    });
  });

  it("merges successive registrations", () => {
    const first = reducer(undefined, registerAccountAliases([ACCOUNT_ID]));
    const second = reducer(first, registerAccountAliases([TOKEN_ACCOUNT_ID]));
    expect(Object.keys(second.accountIdByAlias)).toHaveLength(2);
  });

  it("keeps the same state reference when nothing is new", () => {
    const state = reducer(undefined, registerAccountAliases([ACCOUNT_ID]));
    expect(reducer(state, registerAccountAliases([ACCOUNT_ID]))).toBe(state);
  });
});
