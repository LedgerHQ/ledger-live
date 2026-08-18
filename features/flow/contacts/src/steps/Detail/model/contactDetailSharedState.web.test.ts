import { mockContact, mockContactAddress, mockMeContact } from "@domain/entity-contact/schema.mock";
import {
  createContactDetailLedgerWalletAccountsIntent,
  createContactDetailSharedState,
} from "./contactDetailSharedState";

const formatMeDisplayName = (name: string) => `${name} (Me)`;

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
    expect(createContactDetailSharedState(mockMeContact(), formatMeDisplayName)).toEqual({
      contact: mockMeContact(),
      displayName: "Me",
      addressCount: 0,
      ledgerWalletAccountsIntent: { type: "open-ledger-wallet-accounts" },
    });
  });

  it("exposes a renamed Me display name with the Me suffix", () => {
    const me = mockMeContact({ name: "Brian" });

    expect(createContactDetailSharedState(me, formatMeDisplayName)).toMatchObject({
      displayName: "Brian (Me)",
      addressCount: 0,
      ledgerWalletAccountsIntent: { type: "open-ledger-wallet-accounts" },
    });
  });

  it("counts only external addresses saved on Me", () => {
    const me = mockMeContact({
      addresses: [mockContactAddress()],
    });

    expect(createContactDetailSharedState(me, formatMeDisplayName).addressCount).toBe(1);
  });

  it("does not expose the ledger wallet accounts intent for saved contacts", () => {
    expect(
      createContactDetailSharedState(mockContact({ name: "Ada" }), formatMeDisplayName),
    ).toMatchObject({
      displayName: "Ada",
      ledgerWalletAccountsIntent: undefined,
    });
  });
});
