import { act, renderHook } from "@tests/test-renderer";
import { useRecipientScreenView } from "../useRecipientScreenView";
import { useAddressValidation } from "../useAddressValidation";
import { useClipboardRecipient } from "../useClipboardRecipient";
import { useSendFlowData } from "../../../../context/SendFlowContext";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useContacts, useContactsFeature } from "@features/platform-contacts";
import {
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
} from "@ledgerhq/ledger-wallet-framework/errors";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { AddressSearchResult } from "@ledgerhq/live-common/flows/send/recipient/types";
import { mockContact, mockContactAddress } from "@domain/entity-contact/schema.mock";
import { createMockAccount, createMockCurrency, createMockTokenCurrency } from "./accounts";
import { useRecipientContactSelection } from "../../../../context/RecipientContactSelectionContext";
import { useContactsFeatureIntroductionViewModel } from "../useContactsFeatureIntroductionViewModel";

jest.mock("../useAddressValidation");
jest.mock("../useClipboardRecipient");
jest.mock("../../../../context/SendFlowContext");
jest.mock("@ledgerhq/live-common/account/index");
jest.mock("@features/platform-contacts", () => ({
  useContacts: jest.fn(),
  useContactsFeature: jest.fn(),
}));
jest.mock("../../../../context/RecipientContactSelectionContext");
jest.mock("../useContactsFeatureIntroductionViewModel");

const mockedUseAddressValidation = jest.mocked(useAddressValidation);
const mockedUseClipboardRecipient = jest.mocked(useClipboardRecipient);
const mockedUseSendFlowData = jest.mocked(useSendFlowData);
const mockedGetMainAccount = jest.mocked(getMainAccount);
const mockedUseContacts = jest.mocked(useContacts);
const mockedUseContactsFeature = jest.mocked(useContactsFeature);
const mockedUseRecipientContactSelection = jest.mocked(useRecipientContactSelection);
const mockedUseContactsFeatureIntroductionViewModel = jest.mocked(
  useContactsFeatureIntroductionViewModel,
);

const mockAccount = createMockAccount({
  id: "account_1",
  currency: createMockCurrency({ id: "ethereum", family: "evm" }),
});

const mockRecipientSearch = {
  value: "",
  setValue: jest.fn(),
  clear: jest.fn(),
};

const idleResult: AddressSearchResult = {
  status: "idle",
  error: null,
  bridgeErrors: {},
  bridgeWarnings: {},
  hasBridgeValidationResult: false,
  matchedAccounts: [],
  resolvedAddress: undefined,
  ensName: undefined,
  isLedgerAccount: false,
  accountName: undefined,
  accountBalance: undefined,
  accountBalanceFormatted: undefined,
  isFirstInteraction: false,
  matchedRecentAddress: undefined,
  matchedContact: undefined,
};

describe("useRecipientScreenView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetMainAccount.mockImplementation((account, parentAccount) => {
      if (!account) return mockAccount;
      return account.type === "Account" ? account : parentAccount || mockAccount;
    });
    mockedUseClipboardRecipient.mockReturnValue({ clipboardAddress: null });
    mockedUseSendFlowData.mockReturnValue({
      recipientSearch: mockRecipientSearch,
      state: {} as never,
      uiConfig: {} as never,
    });
    mockedUseAddressValidation.mockReturnValue({
      result: idleResult,
      isLoading: false,
      validateAddress: jest.fn(),
    });
    mockedUseContacts.mockReturnValue([]);
    mockedUseContactsFeature.mockReturnValue({
      isEnabled: false,
      showNewBadge: false,
      eligibleAddressFamilies: ["evm"],
    });
    mockedUseRecipientContactSelection.mockReturnValue({
      selectedContact: undefined,
      selectContact: jest.fn(),
      clearSelectedContact: jest.fn(),
    });
    mockedUseContactsFeatureIntroductionViewModel.mockReturnValue({
      isOpen: false,
      title: "",
      highlights: [],
      primaryActionLabel: "",
      onComplete: jest.fn(),
      onClose: jest.fn(),
    });
  });

  it.each([
    { isEnabled: true, families: ["evm"], isContactsEntryAvailable: true },
    { isEnabled: false, families: ["evm"], isContactsEntryAvailable: false },
    { isEnabled: true, families: ["tron"], isContactsEntryAvailable: false },
  ])(
    "offers the contacts introduction only when the feature is enabled for the family (%o)",
    ({ isEnabled, families, isContactsEntryAvailable }) => {
      mockedUseContactsFeature.mockReturnValue({
        isEnabled,
        showNewBadge: false,
        eligibleAddressFamilies: families,
      });

      renderHook(() =>
        useRecipientScreenView({
          account: mockAccount,
          currency: createMockCurrency({ id: "ethereum", family: "evm" }),
          onAddressSelected: jest.fn(),
          recipientSupportsDomain: true,
        }),
      );

      expect(mockedUseContactsFeatureIntroductionViewModel).toHaveBeenCalledWith({
        isContactsEntryAvailable,
      });
    },
  );

  it("shows initial state when no search value", () => {
    const { result } = renderHook(() =>
      useRecipientScreenView({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
      }),
    );

    expect(result.current.showInitialState).toBe(true);
    expect(result.current.showEmptyContactsState).toBe(false);
    expect(result.current.showSearchResults).toBe(false);
  });

  it("shows empty contacts state when the contacts feature is enabled and no contact matches the network", () => {
    mockedUseContactsFeature.mockReturnValue({
      isEnabled: true,
      showNewBadge: false,
      eligibleAddressFamilies: ["evm"],
    });
    mockedUseContacts.mockReturnValue([
      mockContact({
        id: "contact-sol",
        name: "Alice",
        addresses: [
          mockContactAddress({
            id: "address-sol",
            currencyId: "solana",
            label: "Solana",
            address: "SolanaAddress123",
          }),
        ],
      }),
    ]);

    const { result } = renderHook(() =>
      useRecipientScreenView({
        account: mockAccount,
        currency: createMockCurrency({ id: "ethereum" }),
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
      }),
    );

    expect(result.current.showInitialState).toBe(true);
    expect(result.current.showEmptyContactsState).toBe(true);
    expect(mockedUseAddressValidation).toHaveBeenCalledWith(
      expect.objectContaining({ canSearchContactsByName: true }),
    );
  });

  it("does not show empty contacts state when the currency family is not eligible", () => {
    mockedUseContactsFeature.mockReturnValue({
      isEnabled: true,
      showNewBadge: false,
      eligibleAddressFamilies: ["evm"],
    });

    const { result } = renderHook(() =>
      useRecipientScreenView({
        account: createMockAccount({
          currency: createMockCurrency({ id: "tron", family: "tron" }),
        }),
        currency: createMockCurrency({ id: "tron", family: "tron" }),
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
      }),
    );

    expect(result.current.showEmptyContactsState).toBe(false);
    expect(mockedUseAddressValidation).toHaveBeenCalledWith(
      expect.objectContaining({ canSearchContactsByName: false }),
    );
  });

  it("does not show empty contacts state when a contact matches the network", () => {
    mockedUseContactsFeature.mockReturnValue({
      isEnabled: true,
      showNewBadge: false,
      eligibleAddressFamilies: ["evm"],
    });
    mockedUseContacts.mockReturnValue([
      mockContact({
        id: "contact-eth",
        name: "Alice",
        addresses: [
          mockContactAddress({
            id: "address-eth",
            currencyId: "ethereum",
            label: "Ethereum",
            address: "0x1234567890123456789012345678901234567890",
          }),
        ],
      }),
    ]);

    const { result } = renderHook(() =>
      useRecipientScreenView({
        account: mockAccount,
        currency: createMockCurrency({ id: "ethereum" }),
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
      }),
    );

    expect(result.current.showInitialState).toBe(true);
    expect(result.current.showContactsList).toBe(true);
    expect(result.current.showEmptyContactsState).toBe(false);
  });

  it("only exposes saved contact addresses from the selected network", () => {
    mockedUseContactsFeature.mockReturnValue({
      isEnabled: true,
      showNewBadge: false,
      eligibleAddressFamilies: ["evm"],
    });
    mockedUseContacts.mockReturnValue([
      mockContact({
        id: "contact-me",
        isMe: true,
        name: "Me",
        addresses: [mockContactAddress({ id: "address-me", currencyId: "ethereum" })],
      }),
      mockContact({
        id: "contact-alice",
        name: "Alice",
        addresses: [
          mockContactAddress({ id: "address-eth", currencyId: "ethereum" }),
          mockContactAddress({ id: "address-usdc", currencyId: "ethereum/erc20/usd_coin" }),
          mockContactAddress({ id: "address-sol", currencyId: "solana" }),
        ],
      }),
      mockContact({
        id: "contact-bob",
        name: "Bob",
        addresses: [mockContactAddress({ id: "address-btc", currencyId: "bitcoin" })],
      }),
    ]);

    const { result } = renderHook(() =>
      useRecipientScreenView({
        account: mockAccount,
        currency: createMockCurrency({ id: "ethereum" }),
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
      }),
    );

    expect(result.current.contactsOnNetwork).toHaveLength(1);
    expect(result.current.contactsOnNetwork[0]).toMatchObject({
      id: "contact-alice",
      addresses: [{ id: "address-eth" }, { id: "address-usdc" }],
    });
  });

  it("opens the address sheet when a contact is selected", () => {
    const onAddressSelected = jest.fn();
    const contact = mockContact({
      addresses: [
        mockContactAddress({
          currencyId: "ethereum",
          address: "0x1234567890123456789012345678901234567890",
        }),
      ],
    });

    const { result } = renderHook(() =>
      useRecipientScreenView({
        account: mockAccount,
        currency: createMockCurrency({ id: "ethereum" }),
        onAddressSelected,
        recipientSupportsDomain: true,
      }),
    );

    act(() => result.current.handleContactSelect(contact));

    expect(result.current.contactAddressPicker.contact).toBe(contact);
    expect(onAddressSelected).not.toHaveBeenCalled();
  });

  it("fills the recipient after an address is chosen in the sheet", () => {
    const onAddressSelected = jest.fn();
    const contact = mockContact({
      addresses: [
        mockContactAddress({
          id: "address-eth",
          currencyId: "ethereum",
          address: "0xeth",
        }),
      ],
    });

    const { result } = renderHook(() =>
      useRecipientScreenView({
        account: mockAccount,
        currency: createMockCurrency({ id: "ethereum" }),
        onAddressSelected,
        recipientSupportsDomain: true,
      }),
    );

    act(() => result.current.handleContactSelect(contact));
    act(() => result.current.contactAddressPicker.onSelectAddress(contact.addresses[0]));

    expect(onAddressSelected).toHaveBeenCalledWith("0xeth", undefined);
    expect(result.current.contactAddressPicker.contact).toBeNull();
  });

  it("shows an exact contact search result when its network address is ambiguous", () => {
    const contact = mockContact({
      name: "Benoit",
      addresses: [
        mockContactAddress({ id: "address-one", currencyId: "ethereum" }),
        mockContactAddress({ id: "address-two", currencyId: "ethereum" }),
      ],
    });
    mockedUseContactsFeature.mockReturnValue({
      isEnabled: true,
      showNewBadge: false,
      eligibleAddressFamilies: ["evm"],
    });
    mockedUseContacts.mockReturnValue([contact]);
    mockedUseSendFlowData.mockReturnValue({
      recipientSearch: { ...mockRecipientSearch, value: "benoit" },
      state: {} as never,
      uiConfig: {} as never,
    });

    const { result } = renderHook(() =>
      useRecipientScreenView({
        account: mockAccount,
        currency: createMockCurrency({ id: "ethereum" }),
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
      }),
    );

    expect(result.current.showContactSearchResult).toBe(true);
    expect(result.current.contactSearchResult).toEqual(contact);
    expect(result.current.showSearchResults).toBe(false);
  });

  it("shows search results when search value is provided", () => {
    mockedUseSendFlowData.mockReturnValue({
      recipientSearch: { ...mockRecipientSearch, value: "some_address" },
      state: {} as never,
      uiConfig: {} as never,
    });

    const { result } = renderHook(() =>
      useRecipientScreenView({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
      }),
    );

    expect(result.current.showInitialState).toBe(false);
    expect(result.current.showSearchResults).toBe(true);
  });

  it("calls onAddressSelected when handleAddressSelect is called", () => {
    const onAddressSelected = jest.fn();

    const { result } = renderHook(() =>
      useRecipientScreenView({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected,
        recipientSupportsDomain: true,
      }),
    );

    result.current.handleAddressSelect("new_address", "ens_name");

    expect(onAddressSelected).toHaveBeenCalledWith("new_address", "ens_name");
  });

  it("passes the current transaction to address and clipboard validation", () => {
    const transaction = { family: "bitcoin", recipient: "" } as Transaction;

    renderHook(() =>
      useRecipientScreenView({
        account: mockAccount,
        transaction,
        currency: mockAccount.currency,
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
      }),
    );

    expect(mockedUseAddressValidation).toHaveBeenCalledWith(
      expect.objectContaining({ transaction }),
    );
    expect(mockedUseClipboardRecipient).toHaveBeenCalledWith(
      expect.objectContaining({ transaction }),
    );
  });

  it("shows sanctioned banner when address is sanctioned", () => {
    mockedUseSendFlowData.mockReturnValue({
      recipientSearch: { ...mockRecipientSearch, value: "sanctioned_address" },
      state: {} as never,
      uiConfig: {} as never,
    });

    mockedUseAddressValidation.mockReturnValue({
      result: { ...idleResult, status: "sanctioned", error: "sanctioned" },
      isLoading: false,
      validateAddress: jest.fn(),
    });

    const { result } = renderHook(() =>
      useRecipientScreenView({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
      }),
    );

    expect(result.current.showSanctionedBanner).toBe(true);
    expect(result.current.isSanctioned).toBe(true);
  });

  it("shows address validation error for incorrect format", () => {
    mockedUseSendFlowData.mockReturnValue({
      recipientSearch: { ...mockRecipientSearch, value: "invalid_address" },
      state: {} as never,
      uiConfig: {} as never,
    });

    mockedUseAddressValidation.mockReturnValue({
      result: { ...idleResult, status: "invalid", error: "incorrect_format" },
      isLoading: false,
      validateAddress: jest.fn(),
    });

    const { result } = renderHook(() =>
      useRecipientScreenView({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
      }),
    );

    expect(result.current.showAddressValidationError).toBe(true);
    expect(result.current.addressValidationErrorType).toBe("incorrect_format");
  });

  it("shows matched address when validation is valid", () => {
    mockedUseSendFlowData.mockReturnValue({
      recipientSearch: { ...mockRecipientSearch, value: "valid_address" },
      state: {} as never,
      uiConfig: {} as never,
    });

    mockedUseAddressValidation.mockReturnValue({
      result: { ...idleResult, status: "valid", hasBridgeValidationResult: true },
      isLoading: false,
      validateAddress: jest.fn(),
    });

    const { result } = renderHook(() =>
      useRecipientScreenView({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
      }),
    );

    expect(result.current.showMatchedAddress).toBe(true);
    expect(result.current.isAddressValid).toBe(true);
  });

  it("identifies self-transfer error correctly", () => {
    mockedUseSendFlowData.mockReturnValue({
      recipientSearch: { ...mockRecipientSearch, value: "source_address" },
      state: {} as never,
      uiConfig: {} as never,
    });

    const selfTransferError = new InvalidAddressBecauseDestinationIsAlsoSource();
    mockedUseAddressValidation.mockReturnValue({
      result: { ...idleResult, status: "valid", bridgeErrors: { recipient: selfTransferError } },
      isLoading: false,
      validateAddress: jest.fn(),
    });

    const { result } = renderHook(() =>
      useRecipientScreenView({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
      }),
    );

    expect(result.current.showBridgeRecipientError).toBe(true);
    expect(result.current.bridgeRecipientError).toBe(selfTransferError);
  });

  it("treats InvalidAddress as incorrect format for domain-like strings", () => {
    mockedUseSendFlowData.mockReturnValue({
      recipientSearch: { ...mockRecipientSearch, value: "invalid.eth" },
      state: {} as never,
      uiConfig: {} as never,
    });

    const invalidAddressError = new InvalidAddress();
    mockedUseAddressValidation.mockReturnValue({
      result: { ...idleResult, status: "valid", bridgeErrors: { recipient: invalidAddressError } },
      isLoading: false,
      validateAddress: jest.fn(),
    });

    const { result } = renderHook(() =>
      useRecipientScreenView({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
      }),
    );

    expect(result.current.addressValidationErrorType).toBe("wallet_not_exist");
  });

  it("shows empty state when no matches and not complete", () => {
    mockedUseSendFlowData.mockReturnValue({
      recipientSearch: { ...mockRecipientSearch, value: "searching" },
      state: {} as never,
      uiConfig: {} as never,
    });

    mockedUseAddressValidation.mockReturnValue({
      result: idleResult,
      isLoading: false,
      validateAddress: jest.fn(),
    });

    const { result } = renderHook(() =>
      useRecipientScreenView({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
      }),
    );

    expect(result.current.showEmptyState).toBe(true);
  });

  it("exposes the clipboard address and pastes it into the recipient search on demand", () => {
    mockedUseClipboardRecipient.mockReturnValue({ clipboardAddress: "0xClipboardAddress" });

    const { result } = renderHook(() =>
      useRecipientScreenView({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
      }),
    );

    expect(result.current.clipboardAddress).toBe("0xClipboardAddress");

    result.current.handlePasteFromClipboard();

    expect(mockRecipientSearch.setValue).toHaveBeenCalledWith("0xClipboardAddress");
  });

  it("does not paste when there is no valid clipboard address", () => {
    mockedUseClipboardRecipient.mockReturnValue({ clipboardAddress: null });

    const { result } = renderHook(() =>
      useRecipientScreenView({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
      }),
    );

    result.current.handlePasteFromClipboard();

    expect(mockRecipientSearch.setValue).not.toHaveBeenCalled();
  });

  it("shows loading state when validation is in progress", () => {
    mockedUseAddressValidation.mockReturnValue({
      result: { ...idleResult, status: "loading" },
      isLoading: true,
      validateAddress: jest.fn(),
    });

    const { result } = renderHook(() =>
      useRecipientScreenView({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
      }),
    );

    expect(result.current.isLoading).toBe(true);
  });
});
