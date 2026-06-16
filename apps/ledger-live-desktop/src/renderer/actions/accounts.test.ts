import type { Account, AccountUserData } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
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
  const userData = { id, name: `custom-${id}` } as unknown as AccountUserData;
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
});
