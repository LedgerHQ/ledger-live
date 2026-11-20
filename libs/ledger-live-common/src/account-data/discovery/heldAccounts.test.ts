import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/accountId";
import { fromLegacyAccount, type LegacyAccountIdentity } from "../../account/accountDescriptor";
import { heldAccountMatcher } from "./heldAccounts";

// The coin-aleo testnet fixture account.
const address = "aleo1uhf67fhy46jvv5hadf586pkdarax6ppuzq8xtpk7jdk9hhujku8sfa39ml";
const viewKey = "AViewKey1jyaKC65RhaGN3b6h79hLdwTBk3YAMbRL1MMeCArLDJ6E";

const aleoAccount = (customData?: string): LegacyAccountIdentity => ({
  id: encodeAccountId({
    type: "js",
    version: "2",
    currencyId: "aleo",
    xpubOrAddress: address,
    derivationMode: "aleo",
    customData,
  }),
  currency: { id: "aleo" },
  derivationMode: "aleo",
  index: 2,
  freshAddress: address,
});

const discovered = fromLegacyAccount(aleoAccount());

describe("heldAccountMatcher", () => {
  it("matches a discovered Aleo account, keyed on its address, to the held one keyed with its view key", () => {
    const isHeld = heldAccountMatcher([aleoAccount(viewKey)]);
    expect(discovered.key).toBe(address);
    expect(isHeld(discovered)).toBe(true);
  });

  it("does not match an account the store does not hold", () => {
    expect(heldAccountMatcher([])(discovered)).toBe(false);
  });

  it("skips a held account its family cannot express", () => {
    const broken = { ...aleoAccount(viewKey), currency: { id: "bitcoin" } };
    expect(heldAccountMatcher([broken])(discovered)).toBe(false);
  });
});
