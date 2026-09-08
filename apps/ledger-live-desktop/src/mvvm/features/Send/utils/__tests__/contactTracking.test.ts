import type { AddressSearchResult } from "@ledgerhq/live-common/flows/send/recipient/types";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { getRecipientResolution, getSendFlowTrackingPage } from "../contactTracking";

function createResult(overrides: Partial<AddressSearchResult> = {}): AddressSearchResult {
  return {
    status: "idle",
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
    hasBridgeValidationResult: false,
    ...overrides,
  };
}

describe("getRecipientResolution", () => {
  it("classifies an address matching a saved contact", () => {
    const resolution = getRecipientResolution(
      "0x123",
      createResult({
        status: "valid",
        matchedContact: {
          contactId: "contact-1",
          contactName: "Alice",
          addressId: "address-1",
          addressLabel: "Main",
          address: "0x123",
        },
      }),
    );

    expect(resolution).toEqual({
      queryType: "address",
      resultType: "contact address match",
      recipientType: "contact",
      addressAlreadyUsed: false,
    });
  });

  it("classifies a contact-name result", () => {
    const resolution = getRecipientResolution("Alice", createResult(), true);

    expect(resolution.queryType).toBe("contact name");
    expect(resolution.resultType).toBe("contact name match");
    expect(resolution.recipientType).toBe("contact");
  });

  it("classifies a name-matched contact even when resolvedAddress equals the saved address", () => {
    const resolution = getRecipientResolution(
      "Alice",
      createResult({
        resolvedAddress: "0x123",
        matchedContact: {
          contactId: "contact-1",
          contactName: "Alice",
          addressId: "address-1",
          addressLabel: "Main",
          address: "0x123",
        },
      }),
    );

    expect(resolution.queryType).toBe("contact name");
    expect(resolution.resultType).toBe("contact name match");
  });

  it("classifies an own account and an unknown recent address", () => {
    expect(
      getRecipientResolution("0xabc", createResult({ status: "valid", isLedgerAccount: true }))
        .recipientType,
    ).toBe("my account");

    const recentAddress = getRecipientResolution(
      "0xdef",
      createResult({
        status: "valid",
        matchedRecentAddress: {
          address: "0xdef",
          currency: { id: "ethereum" } as never,
          lastUsedAt: new Date(),
        },
      }),
    );
    expect(recentAddress.resultType).toBe("unknown address");
    expect(recentAddress.addressAlreadyUsed).toBe(true);
  });

  it("classifies an ENS input as a contact-name match when the contact name is the ENS", () => {
    const resolution = getRecipientResolution(
      "alice.eth",
      createResult({
        status: "ens_resolved",
        ensName: "alice.eth",
        resolvedAddress: "0x123",
        matchedContact: {
          contactId: "contact-1",
          contactName: "alice.eth",
          addressId: "address-1",
          addressLabel: "Main",
          address: "0x123",
        },
      }),
    );

    expect(resolution).toEqual({
      queryType: "ens",
      resultType: "contact name match",
      recipientType: "contact",
      addressAlreadyUsed: false,
    });
  });

  it("classifies an ENS that resolves to a saved contact address", () => {
    expect(
      getRecipientResolution(
        "alice.eth",
        createResult({
          status: "ens_resolved",
          ensName: "alice.eth",
          resolvedAddress: "0x123",
          matchedContact: {
            contactId: "contact-1",
            contactName: "Alice",
            addressId: "address-1",
            addressLabel: "Main",
            address: "0x123",
          },
        }),
      ),
    ).toEqual({
      queryType: "ens",
      resultType: "contact address match",
      recipientType: "contact",
      addressAlreadyUsed: false,
    });
  });

  it("classifies ENS and unresolved input", () => {
    expect(
      getRecipientResolution(
        "alice.eth",
        createResult({
          status: "ens_resolved",
          ensName: "alice.eth",
          resolvedAddress: "0x123",
        }),
      ),
    ).toMatchObject({
      queryType: "ens",
      resultType: "unknown address",
      recipientType: "external address",
    });

    expect(getRecipientResolution("0x-invalid", createResult()).resultType).toBe("no result");
  });

  it("classifies unresolved input with the canonical contact-name rules", () => {
    expect(getRecipientResolution("Alice", createResult()).queryType).toBe("contact name");
    expect(getRecipientResolution("1Password", createResult()).queryType).toBe("unrecognised");
    expect(getRecipientResolution("@Olive", createResult()).queryType).toBe("unrecognised");
  });
});

describe("getSendFlowTrackingPage", () => {
  it("normalizes wizard and nested recipient page names", () => {
    expect(getSendFlowTrackingPage(SEND_FLOW_STEP.RECIPIENT)).toBe("step recipient");
    expect(getSendFlowTrackingPage(SEND_FLOW_STEP.ADD_CONTACT)).toBe("add contact options");
    expect(getSendFlowTrackingPage(SEND_FLOW_STEP.RECIPIENT, true)).toBe("select contact address");
  });
});
