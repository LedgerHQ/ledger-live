import type { Account } from "@ledgerhq/types-live";
import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { publicKeyAccountIdBasis } from "./getAccountShape";

const PUBLIC_KEY = "022a460decc9dba8c452927fecb33d7ae25a8d79dc5442b84feaf8f3aa0e2b575d";
const ADDRESS = "SP3KS7VMY2ZNE6SB88PHR4SKRK2EEPHS8N8MCCBR9";

const storedAccount = (xpubOrAddress: string) =>
  ({
    id: encodeAccountId({
      type: "js",
      version: "2",
      currencyId: "stacks",
      xpubOrAddress,
      derivationMode: "",
    }),
  }) as Account;

describe("publicKeyAccountIdBasis", () => {
  it("keys a scanned account (no stored id) on the device's public key", () => {
    expect(publicKeyAccountIdBasis(undefined, PUBLIC_KEY, ADDRESS)).toBe(PUBLIC_KEY);
  });

  it("keeps a synced account's stored key, even when a live public key is present", () => {
    expect(publicKeyAccountIdBasis(storedAccount(PUBLIC_KEY), "02ffff", ADDRESS)).toBe(PUBLIC_KEY);
  });

  it("keeps a stored id that a legacy bridge once keyed on the address", () => {
    expect(publicKeyAccountIdBasis(storedAccount(ADDRESS), PUBLIC_KEY, ADDRESS)).toBe(ADDRESS);
  });

  it("falls back to the scan rule when the stored id is malformed", () => {
    const malformed = { id: "not-an-account-id" } as Account;
    expect(publicKeyAccountIdBasis(malformed, PUBLIC_KEY, ADDRESS)).toBe(PUBLIC_KEY);
  });

  it("falls back to the address when neither a stored id nor a public key is available", () => {
    expect(publicKeyAccountIdBasis(undefined, undefined, ADDRESS)).toBe(ADDRESS);
    expect(publicKeyAccountIdBasis(undefined, "", ADDRESS)).toBe(ADDRESS);
  });
});
