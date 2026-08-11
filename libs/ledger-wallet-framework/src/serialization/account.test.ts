import type { AccountReadiness } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CryptoCurrency } from "../types";
import { setCryptoAssetsStore } from "../cryptoAssetsStore";
import { genAccount } from "../mocks/account";
import { fromAccountRaw, toAccountRaw } from "./account";

const ethereum = getCryptoCurrencyById("ethereum") as unknown as CryptoCurrency;

beforeAll(() => {
  const store: Parameters<typeof setCryptoAssetsStore>[0] = {
    findTokenById: async () => undefined,
    findTokenByAddressInCurrency: async () => undefined,
    getTokensSyncHash: async () => "",
  };
  setCryptoAssetsStore(store);
});

describe("account serialization — readiness", () => {
  it("round-trips readiness through to/fromAccountRaw", async () => {
    const account = genAccount("readiness-acc", { currency: ethereum });
    account.subAccounts = [];
    const readiness: AccountReadiness = { ready: false, reason: "unrevealed" };
    account.readiness = readiness;

    const raw = toAccountRaw(account);
    expect(raw.readiness).toEqual(readiness);

    const back = await fromAccountRaw(raw);
    expect(back.readiness).toEqual(readiness);
  });

  it("leaves readiness undefined when absent", async () => {
    const account = genAccount("no-readiness-acc", { currency: ethereum });
    account.subAccounts = [];
    delete account.readiness;

    const raw = toAccountRaw(account);
    expect(raw.readiness).toBeUndefined();

    const back = await fromAccountRaw(raw);
    expect(back.readiness).toBeUndefined();
  });
});
