import type { Account, AccountUserData } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
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

describe("initAccounts", () => {
  it("drops accounts whose currency has no coin module", () => {
    const action = initAccounts([
      fakeTuple("btc-1", "bitcoin"),
      fakeTuple("eos-1", "eos"), // no coin-module loader → unsupported
      fakeTuple("btc-2", "bitcoin"),
    ]);

    expect(action.type).toBe("INIT_ACCOUNTS");
    expect(action.payload.accounts.map(a => a.id)).toEqual(["btc-1", "btc-2"]);
    expect(action.payload.accountsUserData.map(u => u.id)).toEqual(["btc-1", "btc-2"]);
  });

  it("keeps all accounts when every currency is supported", () => {
    const action = initAccounts([fakeTuple("btc-1", "bitcoin"), fakeTuple("eth-1", "ethereum")]);

    expect(action.payload.accounts.map(a => a.id)).toEqual(["btc-1", "eth-1"]);
  });

  it("drops accounts on any non-currency error (e.g. unsupported derivation mode)", () => {
    const action = initAccounts([
      fakeTuple("btc-segwit", "bitcoin", ""),
      fakeTuple("btc-legacy", "bitcoin", "unsupported_derivation_mode"),
    ]);

    expect(action.payload.accounts.map(a => a.id)).toEqual(["btc-segwit"]);
  });

  it("does not leak default names into the account names payload", () => {
    const action = initAccounts([starredTupleWithDefaultName("btc-default", "bitcoin")]);
    expect(action.payload.accountsUserData.map(u => u.id)).toEqual([]);
  });
});
