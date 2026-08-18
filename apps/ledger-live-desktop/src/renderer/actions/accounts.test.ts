import type { Account, AccountUserData } from "@ledgerhq/types-live";
import type { UnknownAction } from "redux";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getDefaultAccountName } from "@domain/entity-account-name";
import { initAccounts } from "./accounts";

function fakeTuple(
  id: string,
  currencyId: string,
  derivationMode = "",
): [Account, AccountUserData] {
  const account = {
    id,
    type: "Account",
    currency: getCryptoCurrencyById(currencyId),
    derivationMode,
    name: `name-${id}`,
  } as unknown as Account;
  const userData = { id, name: `custom-${id}`, starredIds: [] } as unknown as AccountUserData;
  return [account, userData];
}

/** An account the user starred but never renamed: its name is the default one. */
function starredTupleWithDefaultName(
  id: string,
  currencyId: string,
  index = 0,
): [Account, AccountUserData] {
  const currency = getCryptoCurrencyById(currencyId);
  const account = {
    id,
    type: "Account",
    currency,
    derivationMode: "",
    index,
    name: `name-${id}`,
  } as unknown as Account;
  const userData = {
    id,
    name: getDefaultAccountName(account),
    starredIds: [id],
  } as unknown as AccountUserData;
  return [account, userData];
}

function starredIdsPayload(tuples: [Account, AccountUserData][]): string[] {
  const action = runInitAccounts(tuples).find(
    a => a.type === "starredAccounts/initStarredFromIds",
  ) as unknown as { payload: string[] };
  return action.payload;
}

function runInitAccounts(tuples: [Account, AccountUserData][]): UnknownAction[] {
  const dispatched: UnknownAction[] = [];
  const dispatch = (action: UnknownAction) => {
    dispatched.push(action);
    return action;
  };
  const thunk = initAccounts(tuples);
  thunk(dispatch as Parameters<typeof thunk>[0], (() => ({})) as never, undefined);
  return dispatched;
}

function initAction(tuples: [Account, AccountUserData][]) {
  const action = runInitAccounts(tuples).find(a => a.type === "INIT_ACCOUNTS");
  return action as unknown as {
    type: string;
    payload: { accounts: Account[]; accountsUserData: AccountUserData[] };
  };
}

describe("initAccounts", () => {
  it("drops accounts whose currency has no coin module", () => {
    const action = initAction([
      fakeTuple("btc-1", "bitcoin"),
      fakeTuple("eos-1", "eos"), // no coin-module loader → unsupported
      fakeTuple("btc-2", "bitcoin"),
    ]);

    expect(action.type).toBe("INIT_ACCOUNTS");
    expect(action.payload.accounts.map(a => a.id)).toEqual(["btc-1", "btc-2"]);
    expect(action.payload.accountsUserData.map(u => u.id)).toEqual(["btc-1", "btc-2"]);
  });

  it("keeps all accounts when every currency is supported", () => {
    const action = initAction([fakeTuple("btc-1", "bitcoin"), fakeTuple("eth-1", "ethereum")]);

    expect(action.payload.accounts.map(a => a.id)).toEqual(["btc-1", "eth-1"]);
  });

  it("drops accounts on any non-currency error (e.g. unsupported derivation mode)", () => {
    const action = initAction([
      fakeTuple("btc-segwit", "bitcoin", ""),
      fakeTuple("btc-legacy", "bitcoin", "unsupported_derivation_mode"),
    ]);

    expect(action.payload.accounts.map(a => a.id)).toEqual(["btc-segwit"]);
  });

  it("keeps starred ids of accounts that kept their default name", () => {
    expect(starredIdsPayload([starredTupleWithDefaultName("btc-default", "bitcoin")])).toEqual([
      "btc-default",
    ]);
  });

  it("collects starred ids from both renamed and default-named accounts", () => {
    const renamed = fakeTuple("btc-renamed", "bitcoin");
    renamed[1].starredIds = ["btc-renamed"];

    expect(
      starredIdsPayload([renamed, starredTupleWithDefaultName("eth-default", "ethereum")]).sort(),
    ).toEqual(["btc-renamed", "eth-default"]);
  });

  it("does not leak default names into the account names payload", () => {
    const action = initAction([starredTupleWithDefaultName("btc-default", "bitcoin")]);
    expect(action.payload.accountsUserData.map(u => u.id)).toEqual([]);
  });

  it("also dispatches account name and starred initialization", () => {
    const types = runInitAccounts([fakeTuple("btc-1", "bitcoin")]).map(a => a.type);
    expect(types).toEqual([
      "INIT_ACCOUNTS",
      "accountNames/initFromUserData",
      "starredAccounts/initStarredFromIds",
    ]);
  });
});
