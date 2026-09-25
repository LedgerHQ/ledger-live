import { mockContact, mockContactAddress, mockMeContact } from "@domain/entity-contact/schema.mock";
import type { Contact } from "@domain/entity-contact";
import {
  createContactDetailLedgerWalletAccountsIntent,
  createContactDetailSharedState,
} from "./contactDetailSharedState";
import { renderHook } from "@testing-library/react";
import { useContactDisplayName } from "@features/platform-contacts";
import { ContactsI18nTestProvider } from "@features/platform-contacts/testing";

let getDisplayName: (contact: Contact) => string;

beforeAll(() => {
  getDisplayName = renderHook(() => useContactDisplayName(), {
    wrapper: ContactsI18nTestProvider,
  }).result.current;
});

describe("createContactDetailLedgerWalletAccountsIntent", () => {
  it("returns the ledger wallet accounts intent for Me", () => {
    expect(createContactDetailLedgerWalletAccountsIntent(mockMeContact())).toEqual({
      type: "open-ledger-wallet-accounts",
    });
  });

  it("returns undefined for saved contacts", () => {
    expect(createContactDetailLedgerWalletAccountsIntent(mockContact())).toBeUndefined();
  });
});

describe("createContactDetailSharedState", () => {
  it("exposes the default Me display name and zero external addresses", () => {
    expect(createContactDetailSharedState(mockMeContact(), getDisplayName)).toEqual({
      contact: mockMeContact(),
      displayName: "My addresses (Me)",
      addressCount: 0,
      ledgerWalletAccountsIntent: { type: "open-ledger-wallet-accounts" },
    });
  });

  it("exposes a renamed Me display name with the Me suffix", () => {
    const me = mockMeContact({ name: "Brian" });

    expect(createContactDetailSharedState(me, getDisplayName)).toMatchObject({
      displayName: "Brian (Me)",
      addressCount: 0,
      ledgerWalletAccountsIntent: { type: "open-ledger-wallet-accounts" },
    });
  });

  it("counts only external addresses saved on Me", () => {
    const me = mockMeContact({
      addresses: [mockContactAddress()],
    });

    expect(createContactDetailSharedState(me, getDisplayName).addressCount).toBe(1);
  });

  it("does not expose the ledger wallet accounts intent for saved contacts", () => {
    expect(
      createContactDetailSharedState(mockContact({ name: "Ada" }), getDisplayName),
    ).toMatchObject({
      displayName: "Ada",
      ledgerWalletAccountsIntent: undefined,
    });
  });
});
