import { computeAccountAlias, initialAccountAliasState } from "./schema";
import { accountIdFromAliasSelector, resolveAccountIdSelector } from "./selectors";

const ACCOUNT_ID = "js:2:bitcoin:xpub6DEHKg8fgKcb5iYGPLtpBYD9gm7nvym3wwhH:segwit";
const alias = computeAccountAlias(ACCOUNT_ID);
const state = { accountIdByAlias: { [alias]: ACCOUNT_ID } };

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
});
