import type { Account } from "@ledgerhq/types-live";
import type { AddressSearchResult } from "../../types";
import { getRecipientMatchPresentation } from "../getRecipientMatchPresentation";

const address = "0x95f98055ag77xe7csuz15e36";

const createSearchResult = (overrides: Partial<AddressSearchResult> = {}): AddressSearchResult =>
  ({
    status: "valid",
    error: null,
    resolvedAddress: undefined,
    ensName: undefined,
    isLedgerAccount: false,
    accountName: undefined,
    accountBalance: undefined,
    accountBalanceFormatted: undefined,
    isFirstInteraction: false,
    matchedRecentAddress: undefined,
    matchedAccounts: [],
    matchedContact: undefined,
    bridgeErrors: undefined,
    bridgeWarnings: undefined,
    hasBridgeValidationResult: true,
    ...overrides,
  }) as AddressSearchResult;

describe("getRecipientMatchPresentation", () => {
  it("returns a ready recipient card for a matched contact when Contacts is enabled", () => {
    const matchedContact = {
      contactId: "contact-remi",
      contactName: "Remi",
      addressId: "address-remi-ethereum",
      addressLabel: "Ethereum",
      address,
    };

    expect(
      getRecipientMatchPresentation({
        searchResult: createSearchResult({ matchedContact }),
        searchValue: address,
        isAddressComplete: true,
        isContactsFeatureEnabled: true,
      }),
    ).toEqual({
      kind: "recipient-card",
      recipientAddress: address,
      ensName: undefined,
      matchedContact,
      matchedRecentAddress: undefined,
      isReady: true,
    });
  });

  it("keeps a partial Ledger account match in the legacy presentation", () => {
    const result = getRecipientMatchPresentation({
      searchResult: createSearchResult({
        accountName: "Ethereum 2",
        matchedAccounts: [
          {
            account: { freshAddress: "0xDifferentAddress" } as Account,
            accountName: undefined,
            accountBalance: undefined,
            accountBalanceFormatted: undefined,
          },
        ],
      }),
      searchValue: address,
      isContactsFeatureEnabled: true,
    });

    expect(result?.kind).toBe("matched-ledger-account");
  });

  it("keeps a case-sensitive partial Ledger account match in the legacy presentation", () => {
    const bitcoinAddress = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
    const caseVariantAddress = "1a1zp1ep5qgefi2dmptftl5slmv7divfna";

    const result = getRecipientMatchPresentation({
      searchResult: createSearchResult({
        accountName: "Bitcoin 1",
        matchedAccounts: [
          {
            account: { freshAddress: bitcoinAddress } as Account,
            accountName: undefined,
            accountBalance: undefined,
            accountBalanceFormatted: undefined,
          },
        ],
      }),
      searchValue: caseVariantAddress,
      isContactsFeatureEnabled: true,
    });

    expect(result?.kind).toBe("matched-ledger-account");
  });

  it("returns a disabled Ledger account suggestion for a bridge error", () => {
    const result = getRecipientMatchPresentation({
      searchResult: createSearchResult({
        matchedAccounts: [
          {
            account: { freshAddress: address } as Account,
            accountName: undefined,
            accountBalance: undefined,
            accountBalanceFormatted: undefined,
          },
        ],
      }),
      searchValue: address,
      hasBridgeError: true,
    });

    expect(result).toMatchObject({
      kind: "matched-ledger-account",
      address,
      isDisabled: true,
    });
  });

  it("returns a recipient card for a bridge error when Contacts is enabled", () => {
    expect(
      getRecipientMatchPresentation({
        searchResult: createSearchResult({
          ensName: "vitalik.eth",
          resolvedAddress: address,
          status: "ens_resolved",
        }),
        searchValue: address,
        isAddressComplete: true,
        hasBridgeError: true,
        isContactsFeatureEnabled: true,
      }),
    ).toEqual({
      kind: "recipient-card",
      recipientAddress: address,
      ensName: "vitalik.eth",
      matchedContact: undefined,
      matchedRecentAddress: undefined,
      isReady: false,
    });
  });

  it("returns a valid-address presentation after an unmatched address is complete", () => {
    expect(
      getRecipientMatchPresentation({
        searchResult: createSearchResult(),
        searchValue: address,
        isAddressComplete: true,
      }),
    ).toEqual({
      kind: "valid-address",
      address,
    });
  });

  it("returns a disabled-address presentation for a sanctioned complete address", () => {
    expect(
      getRecipientMatchPresentation({
        searchResult: createSearchResult({ status: "sanctioned" }),
        searchValue: address,
        isSanctioned: true,
        isAddressComplete: true,
      }),
    ).toEqual({
      kind: "disabled-address",
      address,
    });
  });
});
