import type { Account } from "@ledgerhq/types-live";
import { accountRefOf } from "./accountRef";

const account = (over: Partial<Account> = {}) =>
  ({
    id: "js:2:ethereum:0xabc:",
    freshAddress: "0xabc",
    derivationMode: "",
    currency: { id: "ethereum" },
    ...over,
  }) as Account;

describe("accountRefOf", () => {
  it("builds the ref from the account's id, currency, fresh address and derivation mode", () => {
    expect(accountRefOf(account())).toEqual({
      accountId: "js:2:ethereum:0xabc:",
      currencyId: "ethereum",
      address: "0xabc",
      derivationMode: "",
    });
  });

  it("falls back to the address encoded in the id when there is no fresh address", () => {
    expect(accountRefOf(account({ freshAddress: "" })).address).toBe("0xabc");
  });
});
