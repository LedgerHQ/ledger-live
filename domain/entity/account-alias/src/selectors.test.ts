import { parseAnyAccountId } from "@domain/entity-account";
import { computeAccountAlias, initialAccountAliasState } from "./schema";
import { accountIdFromAliasSelector, resolveAccountIdSelector } from "./selectors";

const ACCOUNT_ID = "js:2:bitcoin:xpub6DEHKg8fgKcb5iYGPLtpBYD9gm7nvym3wwhH:segwit";
const accountId = parseAnyAccountId(ACCOUNT_ID);
const alias = computeAccountAlias(accountId);
const state = { accountIdByAlias: { [alias]: accountId } };

describe("accountIdFromAliasSelector", () => {
  it("resolves a registered alias", () => {
    expect(accountIdFromAliasSelector(state, alias)).toBe(ACCOUNT_ID);
  });

  it("returns undefined for an unknown alias", () => {
    expect(accountIdFromAliasSelector(initialAccountAliasState, alias)).toBeUndefined();
  });
});

describe("resolveAccountIdSelector", () => {
  it("resolves a registered alias", () => {
    expect(resolveAccountIdSelector(state, alias)).toBe(ACCOUNT_ID);
  });

  it("passes a raw account id through", () => {
    expect(resolveAccountIdSelector(state, ACCOUNT_ID)).toBe(ACCOUNT_ID);
  });

  it("passes a raw token-account id through", () => {
    const tokenId = `${ACCOUNT_ID}+ethereum%2Ferc20%2Fusd__coin`;
    expect(resolveAccountIdSelector(state, tokenId)).toBe(tokenId);
  });

  it("misses instead of throwing on a segment that is not an account id", () => {
    // A route segment comes from a URL or from navigation state an older build persisted, so it can
    // hold anything. A selector that threw on it would take the render down.
    for (const segment of ["", "a+b+c", "trailing+", "+leading"]) {
      expect(resolveAccountIdSelector(state, segment)).toBeUndefined();
    }
  });
});
