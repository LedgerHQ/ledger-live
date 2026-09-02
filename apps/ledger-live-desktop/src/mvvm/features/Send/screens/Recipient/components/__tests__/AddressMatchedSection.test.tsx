/**
 * @jest-environment jsdom
 */
import type { AddressSearchResult } from "@ledgerhq/live-common/flows/send/recipient/types";
import React from "react";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import {
  createMockAccount,
  createMockCurrency,
} from "../../__integrations__/__fixtures__/accounts";
import { AddressMatchedSection } from "../AddressMatchedSection";
import { useAddressMatchedSectionViewModel } from "../../hooks/useAddressMatchedSectionViewModel";

jest.mock("@features/platform-contacts", () => ({
  ContactAvatar: ({ testId }: { testId?: string }) => <span data-testid={testId} />,
}));

const FIXED_NOW = new Date("2026-07-31T10:00:00.000Z");
const address = "0x95f98055ag77xe7csuz15e36";
const formattedAddress = "0x95f980...suz15e36";

function AddressMatchedSectionContainer({
  searchResult,
  isContactsFeatureEnabled,
  hasAddressBook,
  isAddressComplete = true,
  hasBridgeError = false,
  isSanctioned = false,
  onAddContact = jest.fn(),
}: Readonly<{
  searchResult: AddressSearchResult;
  isContactsFeatureEnabled?: boolean;
  hasAddressBook?: boolean;
  isAddressComplete?: boolean;
  hasBridgeError?: boolean;
  isSanctioned?: boolean;
  onAddContact?: () => void;
}>) {
  const viewModel = useAddressMatchedSectionViewModel({
    searchResult,
    searchValue: address,
    onSelect: jest.fn(),
    onAddContact,
    onUnsupportedNetwork: jest.fn(),
    isAddressComplete,
    hasBridgeError,
    isSanctioned,
    isContactsFeatureEnabled,
    hasAddressBook,
    addressBookFamilyName: "Ethereum",
  });

  return <AddressMatchedSection viewModel={viewModel} />;
}

function renderAddressMatchedSection(
  searchResult: AddressSearchResult,
  options?: {
    featureFlagOverrides?: Parameters<typeof withFlagOverrides>[0];
    isContactsFeatureEnabled?: boolean;
    hasAddressBook?: boolean;
    isAddressComplete?: boolean;
    hasBridgeError?: boolean;
    isSanctioned?: boolean;
    onAddContact?: () => void;
  },
) {
  return render(
    <AddressMatchedSectionContainer
      searchResult={searchResult}
      isAddressComplete={options?.isAddressComplete ?? true}
      hasBridgeError={options?.hasBridgeError ?? false}
      isSanctioned={options?.isSanctioned ?? false}
      isContactsFeatureEnabled={options?.isContactsFeatureEnabled}
      hasAddressBook={options?.hasAddressBook}
      onAddContact={options?.onAddContact}
    />,
    options?.featureFlagOverrides
      ? { initialState: withFlagOverrides(options.featureFlagOverrides) }
      : undefined,
  );
}

describe("AddressMatchedSection", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("displays the matched account name with the already used subtitle", () => {
    const searchResult: AddressSearchResult = {
      status: "valid",
      error: null,
      resolvedAddress: address,
      ensName: undefined,
      isLedgerAccount: true,
      accountName: "Ethereum 2",
      accountBalance: undefined,
      accountBalanceFormatted: undefined,
      isFirstInteraction: false,
      matchedRecentAddress: {
        address,
        currency: createMockCurrency({
          id: "ethereum",
          name: "Ethereum",
          ticker: "ETH",
        }),
        lastUsedAt: new Date("2026-07-31T09:57:00.000Z"),
        name: address,
        isLedgerAccount: true,
        accountId: "account_2",
      },
      matchedAccounts: [
        {
          account: createMockAccount({
            id: "account_2",
            freshAddress: address,
          }),
          accountName: undefined,
          accountBalance: undefined,
          accountBalanceFormatted: undefined,
        },
      ],
      matchedContact: undefined,
      bridgeErrors: undefined,
      bridgeWarnings: undefined,
      hasBridgeValidationResult: true,
    };

    renderAddressMatchedSection(searchResult);

    expect(screen.getByTestId("send-address-matched-title")).toHaveTextContent("Address matched");
    expect(screen.getByText("Send to Ethereum 2")).toBeInTheDocument();
    expect(screen.getByText("Already used · 3 min ago")).toBeInTheDocument();
  });

  it("displays the formatted address subtitle when the matched account was not already used", () => {
    const searchResult: AddressSearchResult = {
      status: "valid",
      error: null,
      resolvedAddress: address,
      ensName: undefined,
      isLedgerAccount: true,
      accountName: "Ethereum 2",
      accountBalance: undefined,
      accountBalanceFormatted: undefined,
      isFirstInteraction: false,
      matchedRecentAddress: undefined,
      matchedAccounts: [
        {
          account: createMockAccount({
            id: "account_2",
            freshAddress: address,
          }),
          accountName: undefined,
          accountBalance: undefined,
          accountBalanceFormatted: undefined,
        },
      ],
      matchedContact: undefined,
      bridgeErrors: undefined,
      bridgeWarnings: undefined,
      hasBridgeValidationResult: true,
    };

    renderAddressMatchedSection(searchResult);

    expect(screen.getByText("Send to Ethereum 2")).toBeInTheDocument();
    expect(screen.getByText(formattedAddress)).toBeInTheDocument();
  });

  it("displays the matched contact name instead of ENS when a contact matches the address", () => {
    const searchResult: AddressSearchResult = {
      status: "ens_resolved",
      error: null,
      resolvedAddress: address,
      ensName: "vitalik.eth",
      isLedgerAccount: false,
      accountName: undefined,
      accountBalance: undefined,
      accountBalanceFormatted: undefined,
      isFirstInteraction: false,
      matchedRecentAddress: undefined,
      matchedAccounts: [],
      matchedContact: {
        contactId: "contact-remi",
        contactName: "Remi",
        addressId: "address-remi-ethereum",
        addressLabel: "Ethereum Network",
        address,
      },
      bridgeErrors: undefined,
      bridgeWarnings: undefined,
      hasBridgeValidationResult: true,
    };

    renderAddressMatchedSection(searchResult, {
      isContactsFeatureEnabled: true,
    });

    expect(screen.getByTestId("send-recipient-card")).toBeInTheDocument();
    expect(screen.getByText("Remi")).toBeInTheDocument();
    expect(screen.queryByText(/vitalik\.eth/)).not.toBeInTheDocument();
  });

  it("displays the full ENS and resolved address in the new recipient card", () => {
    const searchResult: AddressSearchResult = {
      status: "ens_resolved",
      error: null,
      resolvedAddress: address,
      ensName: "vitalik.eth",
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
    };

    renderAddressMatchedSection(searchResult, {
      isContactsFeatureEnabled: true,
      hasAddressBook: true,
    });

    expect(screen.getByText("vitalik.eth")).toBeInTheDocument();
    expect(screen.getByText(address)).toBeInTheDocument();
    expect(screen.getByTestId("send-recipient-card-add-contact")).toBeEnabled();
  });

  it("hides recipient card actions when a bridge error is present", () => {
    const searchResult: AddressSearchResult = {
      status: "valid",
      error: null,
      resolvedAddress: address,
      ensName: "vitalik.eth",
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
    };

    renderAddressMatchedSection(searchResult, {
      isContactsFeatureEnabled: true,
      hasAddressBook: true,
      hasBridgeError: true,
    });

    expect(screen.getByTestId("send-recipient-card")).toBeInTheDocument();
    expect(screen.getByText(address)).toBeInTheDocument();
    expect(screen.queryByText("vitalik.eth")).not.toBeInTheDocument();
    expect(screen.queryByTestId("send-address-matched-title")).not.toBeInTheDocument();
    expect(screen.queryByTestId("send-recipient-card-send")).not.toBeInTheDocument();
    expect(screen.queryByTestId("send-recipient-card-add-contact")).not.toBeInTheDocument();
    expect(screen.queryByTestId("send-matched-address-button")).not.toBeInTheDocument();
  });

  it("shows the recipient card instead of a legacy disabled row when a bridge error is present and Contacts is enabled", () => {
    const searchResult: AddressSearchResult = {
      status: "valid",
      error: null,
      resolvedAddress: address,
      ensName: undefined,
      isLedgerAccount: true,
      accountName: "Ethereum 2",
      accountBalance: undefined,
      accountBalanceFormatted: undefined,
      isFirstInteraction: false,
      matchedRecentAddress: {
        address,
        currency: createMockCurrency({
          id: "ethereum",
          name: "Ethereum",
          ticker: "ETH",
        }),
        lastUsedAt: new Date("2026-07-31T09:57:00.000Z"),
        name: address,
        isLedgerAccount: true,
        accountId: "account_2",
      },
      matchedAccounts: [
        {
          account: createMockAccount({
            id: "account_2",
            freshAddress: address,
          }),
          accountName: undefined,
          accountBalance: undefined,
          accountBalanceFormatted: undefined,
        },
      ],
      matchedContact: undefined,
      bridgeErrors: undefined,
      bridgeWarnings: undefined,
      hasBridgeValidationResult: true,
    };

    renderAddressMatchedSection(searchResult, {
      isContactsFeatureEnabled: true,
      hasBridgeError: true,
    });

    expect(screen.getByTestId("send-recipient-card")).toBeInTheDocument();
    expect(screen.getByText(address)).toBeInTheDocument();
    expect(screen.queryByTestId("send-address-matched-title")).not.toBeInTheDocument();
    expect(screen.queryByText("Send to Ethereum 2")).not.toBeInTheDocument();
    expect(screen.queryByTestId("send-matched-address-button")).not.toBeInTheDocument();
  });

  it("keeps the legacy disabled row when a bridge error is present and Contacts is disabled", () => {
    const searchResult: AddressSearchResult = {
      status: "valid",
      error: null,
      resolvedAddress: address,
      ensName: undefined,
      isLedgerAccount: true,
      accountName: "Ethereum 2",
      accountBalance: undefined,
      accountBalanceFormatted: undefined,
      isFirstInteraction: false,
      matchedRecentAddress: {
        address,
        currency: createMockCurrency({
          id: "ethereum",
          name: "Ethereum",
          ticker: "ETH",
        }),
        lastUsedAt: new Date("2026-07-31T09:57:00.000Z"),
        name: address,
        isLedgerAccount: true,
        accountId: "account_2",
      },
      matchedAccounts: [
        {
          account: createMockAccount({
            id: "account_2",
            freshAddress: address,
          }),
          accountName: undefined,
          accountBalance: undefined,
          accountBalanceFormatted: undefined,
        },
      ],
      matchedContact: undefined,
      bridgeErrors: undefined,
      bridgeWarnings: undefined,
      hasBridgeValidationResult: true,
    };

    renderAddressMatchedSection(searchResult, {
      isContactsFeatureEnabled: false,
      hasBridgeError: true,
    });

    expect(screen.queryByTestId("send-recipient-card")).not.toBeInTheDocument();
    expect(screen.getByTestId("send-address-matched-title")).toBeInTheDocument();
    expect(screen.getByTestId("send-matched-address-button")).toBeInTheDocument();
  });

  it("shows the recipient card without actions for a sanctioned address when Contacts is enabled", () => {
    const searchResult: AddressSearchResult = {
      status: "sanctioned",
      error: "sanctioned",
      resolvedAddress: address,
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
    };

    renderAddressMatchedSection(searchResult, {
      isContactsFeatureEnabled: true,
      isSanctioned: true,
    });

    expect(screen.getByTestId("send-recipient-card")).toBeInTheDocument();
    expect(screen.getByText(address)).toBeInTheDocument();
    expect(screen.queryByTestId("send-address-matched-title")).not.toBeInTheDocument();
    expect(screen.queryByTestId("send-recipient-card-send")).not.toBeInTheDocument();
    expect(screen.queryByTestId("send-recipient-card-add-contact")).not.toBeInTheDocument();
    expect(screen.queryByTestId("send-matched-address-button")).not.toBeInTheDocument();
  });

  it("keeps the legacy disabled row for a sanctioned address when Contacts is disabled", () => {
    const searchResult: AddressSearchResult = {
      status: "sanctioned",
      error: "sanctioned",
      resolvedAddress: address,
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
    };

    renderAddressMatchedSection(searchResult, {
      isContactsFeatureEnabled: false,
      isSanctioned: true,
    });

    expect(screen.queryByTestId("send-recipient-card")).not.toBeInTheDocument();
    expect(screen.getByTestId("send-address-matched-title")).toBeInTheDocument();
    expect(screen.getByTestId("send-matched-address-button")).toBeInTheDocument();
  });

  it("opens the add contact step when clicking the add contact button", () => {
    const searchResult: AddressSearchResult = {
      status: "ens_resolved",
      error: null,
      resolvedAddress: address,
      ensName: "vitalik.eth",
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
    };
    const onAddContact = jest.fn();

    renderAddressMatchedSection(searchResult, {
      isContactsFeatureEnabled: true,
      hasAddressBook: true,
      onAddContact,
    });
    screen.getByTestId("send-recipient-card-add-contact").click();

    expect(onAddContact).toHaveBeenCalled();
  });

  it("keeps the new ENS card visible while bridge validation is pending", () => {
    const searchResult: AddressSearchResult = {
      status: "loading",
      error: null,
      resolvedAddress: address,
      ensName: "vitalik.eth",
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
    };

    renderAddressMatchedSection(searchResult, {
      isContactsFeatureEnabled: true,
      hasAddressBook: true,
      isAddressComplete: false,
    });

    expect(screen.getByTestId("send-recipient-card")).toBeInTheDocument();
    expect(screen.getByText("vitalik.eth")).toBeInTheDocument();
    expect(screen.queryByText(/Send to vitalik\.eth/)).not.toBeInTheDocument();
    expect(screen.getByTestId("send-recipient-card-send")).toBeDisabled();
    expect(screen.getByTestId("send-recipient-card-add-contact")).toBeDisabled();
  });

  it("keeps the new raw-address card visible while bridge validation is pending", () => {
    const searchResult: AddressSearchResult = {
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
      hasBridgeValidationResult: false,
    };

    renderAddressMatchedSection(searchResult, {
      isContactsFeatureEnabled: true,
      hasAddressBook: true,
      isAddressComplete: false,
    });

    expect(screen.getByTestId("send-recipient-card")).toBeInTheDocument();
    expect(screen.getByText(address)).toBeInTheDocument();
    expect(screen.queryByText(new RegExp(`Send to ${address}`))).not.toBeInTheDocument();
    expect(screen.getByTestId("send-recipient-card-send")).toBeDisabled();
    expect(screen.getByTestId("send-recipient-card-add-contact")).toBeDisabled();
  });

  it("keeps legacy suggestions for partial matches", () => {
    const searchResult: AddressSearchResult = {
      status: "valid",
      error: null,
      resolvedAddress: undefined,
      ensName: undefined,
      isLedgerAccount: true,
      accountName: "Ethereum 2",
      accountBalance: undefined,
      accountBalanceFormatted: undefined,
      isFirstInteraction: false,
      matchedRecentAddress: undefined,
      matchedAccounts: [
        {
          account: createMockAccount({
            id: "account_2",
            freshAddress: "0xDifferentAddress",
          }),
          accountName: undefined,
          accountBalance: undefined,
          accountBalanceFormatted: undefined,
        },
      ],
      matchedContact: undefined,
      bridgeErrors: undefined,
      bridgeWarnings: undefined,
      hasBridgeValidationResult: false,
    };

    renderAddressMatchedSection(searchResult, {
      isContactsFeatureEnabled: true,
      isAddressComplete: false,
    });

    expect(screen.getByTestId("send-address-matched-title")).toBeInTheDocument();
    expect(screen.queryByTestId("send-recipient-card")).not.toBeInTheDocument();
  });

  it("does not display the first interaction banner when the feature flag is disabled", () => {
    const searchResult: AddressSearchResult = {
      status: "valid",
      error: null,
      resolvedAddress: address,
      ensName: undefined,
      isLedgerAccount: false,
      accountName: undefined,
      accountBalance: undefined,
      accountBalanceFormatted: undefined,
      isFirstInteraction: true,
      matchedRecentAddress: undefined,
      matchedAccounts: [],
      matchedContact: undefined,
      bridgeErrors: undefined,
      bridgeWarnings: undefined,
      hasBridgeValidationResult: true,
    };

    renderAddressMatchedSection(searchResult, {
      featureFlagOverrides: {
        newSendFlowFirstInteractionBanner: { enabled: false },
      },
    });

    expect(screen.queryByTestId("send-recent-history-warning")).not.toBeInTheDocument();
  });
});
