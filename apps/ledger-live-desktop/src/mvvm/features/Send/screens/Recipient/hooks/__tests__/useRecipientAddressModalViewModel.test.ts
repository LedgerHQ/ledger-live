/* eslint-disable @typescript-eslint/consistent-type-assertions */

import { act, renderHook } from "@testing-library/react";
import { useRecipientAddressModalViewModel } from "../useRecipientAddressModalViewModel";
import { useAddressValidation } from "../useAddressValidation";
import { useAddressMatchedSectionViewModel } from "../useAddressMatchedSectionViewModel";
import { useSendFlowData } from "../../../../context/SendFlowContext";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { useContacts, useContactsFeature } from "@features/platform-contacts";
import {
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
} from "@ledgerhq/ledger-wallet-framework/errors";
import {
  createMockAccount,
  createMockCurrency,
  createMockTokenCurrency,
} from "../../__integrations__/__fixtures__/accounts";
import type { SendFlowState } from "@ledgerhq/live-common/flows/send/types";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { AddressSearchResult } from "@ledgerhq/live-common/flows/send/recipient/types";
import { mockContact, mockContactAddress } from "@domain/entity-contact/schema.mock";
import { useRecipientContactSelection } from "../../../../context/RecipientContactSelectionContext";
import { useContactsFeatureIntroductionViewModel } from "../useContactsFeatureIntroductionViewModel";
import { useDoNotAskAgainSkipMemo } from "../../../../hooks/useDoNotAskAgainSkipMemo";
import { useFlowWizard } from "../../../../../FlowWizard/FlowWizardContext";

jest.mock("../useAddressValidation");
jest.mock("../useAddressMatchedSectionViewModel");
jest.mock("../../../../context/SendFlowContext");
jest.mock("../../../../../FlowWizard/FlowWizardContext");
jest.mock("@ledgerhq/live-common/account/index");
jest.mock("@ledgerhq/live-common/bridge/descriptor/send/features");
jest.mock("@features/platform-contacts", () => ({
  useContacts: jest.fn(),
  useContactsFeature: jest.fn(),
}));
jest.mock("../../../../context/RecipientContactSelectionContext");
jest.mock("../useContactsFeatureIntroductionViewModel");
jest.mock("../../../../hooks/useDoNotAskAgainSkipMemo");
jest.mock("~/renderer/reducers/wallet", () => ({
  useMaybeAccountName: jest.fn(),
  useBatchMaybeAccountName: jest.fn(() => []),
  walletSelector: jest.fn((state: { wallet?: unknown }) => state.wallet || {}),
}));

const mockedUseAddressValidation = jest.mocked(useAddressValidation);
const mockedUseAddressMatchedSectionViewModel = jest.mocked(useAddressMatchedSectionViewModel);
const mockedUseSendFlowData = jest.mocked(useSendFlowData);
const mockedGetMainAccount = jest.mocked(getMainAccount);
const mockedSendFeatures = jest.mocked(sendFeatures);
const mockedUseContacts = jest.mocked(useContacts);
const mockedUseContactsFeature = jest.mocked(useContactsFeature);
const mockedUseRecipientContactSelection = jest.mocked(useRecipientContactSelection);
const mockedUseContactsFeatureIntroductionViewModel = jest.mocked(
  useContactsFeatureIntroductionViewModel,
);
const mockedUseDoNotAskAgainSkipMemo = jest.mocked(useDoNotAskAgainSkipMemo);
const mockedUseFlowWizard = jest.mocked(useFlowWizard);
const setDoNotAskAgainSkipMemo = jest.fn();
const goToStep = jest.fn();

const mockAccount = createMockAccount({
  id: "account_1",
  currency: createMockCurrency({ id: "ethereum", family: "evm" }),
});

const mockRecipientSearch = {
  value: "",
  setValue: jest.fn(),
  clear: jest.fn(),
};

const DEFAULT_STATE = {
  transaction: {
    status: {
      errors: {},
    },
  },
} as unknown as SendFlowState;

function createAddressSearchResult(
  overrides: Partial<AddressSearchResult> = {},
): AddressSearchResult {
  return {
    status: "idle",
    error: null,
    bridgeErrors: {},
    bridgeWarnings: {},
    hasBridgeValidationResult: false,
    matchedAccounts: [],
    matchedContact: undefined,
    resolvedAddress: undefined,
    ensName: undefined,
    isLedgerAccount: false,
    accountName: undefined,
    accountBalance: undefined,
    accountBalanceFormatted: undefined,
    isFirstInteraction: true,
    matchedRecentAddress: undefined,
    ...overrides,
  };
}

describe("useRecipientAddressModalViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetMainAccount.mockImplementation((account, parentAccount) => {
      if (!account) return mockAccount;
      return account.type === "Account" ? account : parentAccount || mockAccount;
    });
    mockedUseFlowWizard.mockReturnValue({
      navigation: { goToStep },
    } as never);
    mockedSendFeatures.hasMemoForRecipient.mockReturnValue(false);
    mockedUseDoNotAskAgainSkipMemo.mockReturnValue([false, setDoNotAskAgainSkipMemo]);
    mockedUseContacts.mockReturnValue([]);
    mockedUseContactsFeature.mockReturnValue({
      isEnabled: false,
      showNewBadge: false,
      eligibleAddressFamilies: [],
    });
    mockedUseRecipientContactSelection.mockReturnValue({
      selectedContact: undefined,
      selectContact: jest.fn(),
      clearSelectedContact: jest.fn(),
    });
    mockedUseSendFlowData.mockReturnValue({
      recipientSearch: mockRecipientSearch,
      state: DEFAULT_STATE,
      uiConfig: {} as never,
      isRecipientAddressComplete: false,
    });
    mockedUseAddressValidation.mockReturnValue({
      result: createAddressSearchResult(),
      isLoading: false,
      validateAddress: jest.fn(),
    });
    mockedUseAddressMatchedSectionViewModel.mockReturnValue({
      isVisible: false,
      showHeader: false,
      addressMatchedLabel: "",
      suggestion: null,
      showFirstInteractionWarning: false,
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
        useRecipientAddressModalViewModel({
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
      useRecipientAddressModalViewModel({
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
      useRecipientAddressModalViewModel({
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
      useRecipientAddressModalViewModel({
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
      useRecipientAddressModalViewModel({
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
      useRecipientAddressModalViewModel({
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

  it("advances with the address matching the current currency when a contact has several network addresses", () => {
    const onAddressSelected = jest.fn();
    const contact = mockContact({
      addresses: [
        mockContactAddress({
          id: "address-eth",
          currencyId: "ethereum",
          address: "0xeth",
        }),
        mockContactAddress({
          id: "address-usdt",
          currencyId: "ethereum/erc20/usdt",
          address: "0xusdt",
        }),
      ],
    });

    const { result } = renderHook(() =>
      useRecipientAddressModalViewModel({
        account: mockAccount,
        currency: createMockTokenCurrency(),
        onAddressSelected,
        recipientSupportsDomain: true,
      }),
    );

    act(() => result.current.handleContactSelect(contact));

    expect(onAddressSelected).toHaveBeenCalledWith("0xusdt", undefined, true);
  });

  it("shows a contact choice instead of resolving the first address when a searched contact has several addresses", () => {
    const selectContact = jest.fn();
    const contact = mockContact({
      id: "contact-benoit",
      name: "Benoit",
      addresses: [
        mockContactAddress({ id: "address-1", address: "0x123", currencyId: "ethereum" }),
        mockContactAddress({ id: "address-2", address: "0x456", currencyId: "ethereum" }),
      ],
    });
    mockedUseContactsFeature.mockReturnValue({
      isEnabled: true,
      showNewBadge: false,
      eligibleAddressFamilies: ["evm"],
    });
    mockedUseContacts.mockReturnValue([contact]);
    mockedUseRecipientContactSelection.mockReturnValue({
      selectedContact: undefined,
      selectContact,
      clearSelectedContact: jest.fn(),
    });
    mockedUseSendFlowData.mockReturnValue({
      recipientSearch: { ...mockRecipientSearch, value: "Benoit" },
      state: DEFAULT_STATE,
      uiConfig: {} as never,
      isRecipientAddressComplete: false,
    });
    mockedUseAddressValidation.mockReturnValue({
      result: createAddressSearchResult({
        status: "valid",
        hasBridgeValidationResult: true,
        matchedContact: {
          contactId: contact.id,
          contactName: contact.name,
          addressId: contact.addresses[0]!.id,
          addressLabel: contact.addresses[0]!.label,
          address: contact.addresses[0]!.address,
        },
      }),
      isLoading: false,
      validateAddress: jest.fn(),
    });

    const { result } = renderHook(() =>
      useRecipientAddressModalViewModel({
        account: mockAccount,
        currency: createMockCurrency({ id: "ethereum" }),
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
      }),
    );

    expect(result.current.showContactSearchResult).toBe(true);
    expect(result.current.contactSearchResult).toMatchObject({
      id: contact.id,
      addresses: [{ id: "address-1" }, { id: "address-2" }],
    });
    expect(result.current.showMatchedAddress).toBe(false);
    expect(result.current.isAddressValid).toBe(false);

    act(() => result.current.handleContactSelect(contact));
    expect(selectContact).toHaveBeenCalledWith(contact);
  });

  it("advances straight to the next step for a contact with one address", () => {
    const onAddressSelected = jest.fn();
    const selectContact = jest.fn();
    mockedUseRecipientContactSelection.mockReturnValue({
      selectedContact: undefined,
      selectContact,
      clearSelectedContact: jest.fn(),
    });
    const contact = mockContact({
      addresses: [mockContactAddress({ address: "0x123" })],
    });

    const { result } = renderHook(() =>
      useRecipientAddressModalViewModel({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected,
        recipientSupportsDomain: true,
      }),
    );

    act(() => result.current.handleContactSelect(contact));

    expect(onAddressSelected).toHaveBeenCalledWith("0x123", undefined, true);
    expect(selectContact).not.toHaveBeenCalled();
  });

  it("opens address selection for a contact with multiple addresses", () => {
    const onAddressSelected = jest.fn();
    const selectContact = jest.fn();
    const clearSelectedContact = jest.fn();
    mockedUseRecipientContactSelection.mockReturnValue({
      selectedContact: undefined,
      selectContact,
      clearSelectedContact,
    });
    const contact = mockContact({
      addresses: [
        mockContactAddress({ id: "address-1", address: "0x123" }),
        mockContactAddress({ id: "address-2", address: "0x456" }),
      ],
    });

    const { result } = renderHook(() =>
      useRecipientAddressModalViewModel({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected,
        recipientSupportsDomain: true,
      }),
    );

    act(() => result.current.handleContactSelect(contact));
    expect(selectContact).toHaveBeenCalledWith(contact);
    expect(onAddressSelected).not.toHaveBeenCalled();

    act(() => result.current.handleContactAddressSelect("0x456"));
    expect(clearSelectedContact).toHaveBeenCalledTimes(1);
    expect(onAddressSelected).toHaveBeenCalledWith("0x456", undefined, true);
  });

  it("opens address selection when a contact has several addresses and none match the current currency", () => {
    const onAddressSelected = jest.fn();
    const selectContact = jest.fn();
    mockedUseRecipientContactSelection.mockReturnValue({
      selectedContact: undefined,
      selectContact,
      clearSelectedContact: jest.fn(),
    });
    const contact = mockContact({
      addresses: [
        mockContactAddress({
          id: "address-eth",
          currencyId: "ethereum",
          address: "0xeth",
        }),
        mockContactAddress({
          id: "address-usdc",
          currencyId: "ethereum/erc20/usd_coin",
          address: "0xusdc",
        }),
      ],
    });

    const { result } = renderHook(() =>
      useRecipientAddressModalViewModel({
        account: mockAccount,
        currency: createMockTokenCurrency(),
        onAddressSelected,
        recipientSupportsDomain: true,
      }),
    );

    act(() => result.current.handleContactSelect(contact));

    expect(selectContact).toHaveBeenCalledWith(contact);
    expect(onAddressSelected).not.toHaveBeenCalled();
  });

  it("shows search results when search value is provided", () => {
    mockedUseSendFlowData.mockReturnValue({
      recipientSearch: { ...mockRecipientSearch, value: "some_address" },
      state: DEFAULT_STATE,
      uiConfig: {} as never,
      isRecipientAddressComplete: false,
    });

    const { result } = renderHook(() =>
      useRecipientAddressModalViewModel({
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
      useRecipientAddressModalViewModel({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected,
        recipientSupportsDomain: true,
      }),
    );

    result.current.handleAddressSelect("new_address", "ens_name");

    expect(onAddressSelected).toHaveBeenCalledWith("new_address", "ens_name", true);
  });

  it("asks for confirmation before sending without a memo", () => {
    const onAddressSelected = jest.fn();
    mockedSendFeatures.hasMemoForRecipient.mockReturnValue(true);

    const { result } = renderHook(() =>
      useRecipientAddressModalViewModel({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected,
        recipientSupportsDomain: true,
      }),
    );

    act(() => result.current.handleAddressSelect("new_address", "ens_name"));

    expect(onAddressSelected).toHaveBeenCalledWith("new_address", "ens_name");
    expect(goToStep).toHaveBeenCalledWith("SKIP_MEMO_CONFIRMATION");
  });

  it("sends without confirmation when the memo warning was dismissed permanently", () => {
    const onAddressSelected = jest.fn();
    mockedSendFeatures.hasMemoForRecipient.mockReturnValue(true);
    mockedUseDoNotAskAgainSkipMemo.mockReturnValue([true, setDoNotAskAgainSkipMemo]);

    const { result } = renderHook(() =>
      useRecipientAddressModalViewModel({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected,
        recipientSupportsDomain: true,
      }),
    );

    act(() => result.current.handleAddressSelect("new_address"));

    expect(onAddressSelected).toHaveBeenCalledWith("new_address", undefined, true, {
      value: "",
      type: "NO_MEMO",
    });
  });

  it("passes the current transaction to address validation", () => {
    const transaction = { family: "bitcoin", recipient: "" } as Transaction;
    mockedUseSendFlowData.mockReturnValue({
      recipientSearch: { ...mockRecipientSearch, value: "some_address" },
      state: {
        ...DEFAULT_STATE,
        transaction: {
          ...DEFAULT_STATE.transaction,
          transaction,
        },
      },
      uiConfig: {} as never,
      isRecipientAddressComplete: false,
    });

    renderHook(() =>
      useRecipientAddressModalViewModel({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
      }),
    );

    expect(mockedUseAddressValidation).toHaveBeenCalledWith(
      expect.objectContaining({ transaction }),
    );
  });

  it("shows sanctioned banner when address is sanctioned", () => {
    mockedUseSendFlowData.mockReturnValue({
      recipientSearch: { ...mockRecipientSearch, value: "sanctioned_address" },
      state: DEFAULT_STATE,
      uiConfig: {} as never,
      isRecipientAddressComplete: false,
    });

    mockedUseAddressValidation.mockReturnValue({
      result: {
        status: "sanctioned",
        error: "sanctioned",
        bridgeErrors: {},
        bridgeWarnings: {},
        hasBridgeValidationResult: false,
        matchedAccounts: [],
        matchedContact: undefined,
        resolvedAddress: undefined,
        ensName: undefined,
        isLedgerAccount: false,
        accountName: undefined,
        accountBalance: undefined,
        accountBalanceFormatted: undefined,
        isFirstInteraction: true,
        matchedRecentAddress: undefined,
      },
      isLoading: false,
      validateAddress: jest.fn(),
    });

    const { result } = renderHook(() =>
      useRecipientAddressModalViewModel({
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
      state: DEFAULT_STATE,
      uiConfig: {} as never,
      isRecipientAddressComplete: false,
    });

    mockedUseAddressValidation.mockReturnValue({
      result: {
        status: "invalid",
        error: "incorrect_format",
        bridgeErrors: {},
        bridgeWarnings: {},
        hasBridgeValidationResult: false,
        matchedAccounts: [],
        matchedContact: undefined,
        resolvedAddress: undefined,
        ensName: undefined,
        isLedgerAccount: false,
        accountName: undefined,
        accountBalance: undefined,
        accountBalanceFormatted: undefined,
        isFirstInteraction: true,
        matchedRecentAddress: undefined,
      },
      isLoading: false,
      validateAddress: jest.fn(),
    });

    const { result } = renderHook(() =>
      useRecipientAddressModalViewModel({
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
      state: DEFAULT_STATE,
      uiConfig: {} as never,
      isRecipientAddressComplete: false,
    });

    mockedUseAddressValidation.mockReturnValue({
      result: {
        status: "valid",
        error: null,
        bridgeErrors: {},
        bridgeWarnings: {},
        hasBridgeValidationResult: true,
        matchedAccounts: [],
        matchedContact: undefined,
        resolvedAddress: undefined,
        ensName: undefined,
        isLedgerAccount: false,
        accountName: undefined,
        accountBalance: undefined,
        accountBalanceFormatted: undefined,
        isFirstInteraction: true,
        matchedRecentAddress: undefined,
      },
      isLoading: false,
      validateAddress: jest.fn(),
    });

    const { result } = renderHook(() =>
      useRecipientAddressModalViewModel({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
      }),
    );

    expect(result.current.showMatchedAddress).toBe(true);
    expect(result.current.showEmptyState).toBe(false);
    expect(result.current.isAddressValid).toBe(true);
  });

  it("keeps the recipient valid while the flow recipient is revalidated", () => {
    mockedUseSendFlowData.mockReturnValue({
      recipientSearch: { ...mockRecipientSearch, value: "valid_address" },
      state: {
        ...DEFAULT_STATE,
        recipient: { address: "Valid_Address" },
      } as unknown as SendFlowState,
      uiConfig: {} as never,
      isRecipientAddressComplete: true,
    });

    mockedUseAddressValidation.mockReturnValue({
      result: createAddressSearchResult({ status: "idle", hasBridgeValidationResult: false }),
      isLoading: true,
      validateAddress: jest.fn(),
    });

    const { result } = renderHook(() =>
      useRecipientAddressModalViewModel({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
      }),
    );

    expect(result.current.isAddressValid).toBe(true);
  });

  it("does not consider the address valid when the search differs from the flow recipient", () => {
    mockedUseSendFlowData.mockReturnValue({
      recipientSearch: { ...mockRecipientSearch, value: "another_address" },
      state: {
        ...DEFAULT_STATE,
        recipient: { address: "valid_address" },
      } as unknown as SendFlowState,
      uiConfig: {} as never,
      isRecipientAddressComplete: true,
    });

    mockedUseAddressValidation.mockReturnValue({
      result: createAddressSearchResult({ status: "idle", hasBridgeValidationResult: false }),
      isLoading: true,
      validateAddress: jest.fn(),
    });

    const { result } = renderHook(() =>
      useRecipientAddressModalViewModel({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
      }),
    );

    expect(result.current.isAddressValid).toBe(false);
  });

  it("identifies self-transfer error correctly", () => {
    mockedUseSendFlowData.mockReturnValue({
      recipientSearch: { ...mockRecipientSearch, value: "source_address" },
      state: DEFAULT_STATE,
      uiConfig: {} as never,
      isRecipientAddressComplete: false,
    });

    const selfTransferError = new InvalidAddressBecauseDestinationIsAlsoSource();
    mockedUseAddressValidation.mockReturnValue({
      result: {
        status: "valid",
        error: null,
        bridgeErrors: { recipient: selfTransferError },
        bridgeWarnings: {},
        hasBridgeValidationResult: true,
        matchedAccounts: [],
        matchedContact: undefined,
        resolvedAddress: undefined,
        ensName: undefined,
        isLedgerAccount: false,
        accountName: undefined,
        accountBalance: undefined,
        accountBalanceFormatted: undefined,
        isFirstInteraction: true,
        matchedRecentAddress: undefined,
      },
      isLoading: false,
      validateAddress: jest.fn(),
    });

    const { result } = renderHook(() =>
      useRecipientAddressModalViewModel({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
      }),
    );

    expect(result.current.showBridgeRecipientError).toBe(true);
    expect(result.current.bridgeRecipientError).toBe(selfTransferError);
    expect(result.current.isAddressValid).toBe(false);
  });

  it("treats InvalidAddress as incorrect format for domain-like strings", () => {
    mockedUseSendFlowData.mockReturnValue({
      recipientSearch: { ...mockRecipientSearch, value: "invalid.eth" },
      state: DEFAULT_STATE,
      uiConfig: {} as never,
      isRecipientAddressComplete: false,
    });

    const invalidAddressError = new InvalidAddress();
    mockedUseAddressValidation.mockReturnValue({
      result: {
        status: "valid",
        error: null,
        bridgeErrors: { recipient: invalidAddressError },
        bridgeWarnings: {},
        hasBridgeValidationResult: true,
        matchedAccounts: [],
        matchedContact: undefined,
        resolvedAddress: undefined,
        ensName: undefined,
        isLedgerAccount: false,
        accountName: undefined,
        accountBalance: undefined,
        accountBalanceFormatted: undefined,
        isFirstInteraction: true,
        matchedRecentAddress: undefined,
      },
      isLoading: false,
      validateAddress: jest.fn(),
    });

    const { result } = renderHook(() =>
      useRecipientAddressModalViewModel({
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
      state: DEFAULT_STATE,
      uiConfig: {} as never,
      isRecipientAddressComplete: false,
    });

    mockedUseAddressValidation.mockReturnValue({
      result: {
        status: "idle",
        error: null,
        bridgeErrors: {},
        bridgeWarnings: {},
        hasBridgeValidationResult: false,
        matchedAccounts: [],
        matchedContact: undefined,
        resolvedAddress: undefined,
        ensName: undefined,
        isLedgerAccount: false,
        accountName: undefined,
        accountBalance: undefined,
        accountBalanceFormatted: undefined,
        isFirstInteraction: true,
        matchedRecentAddress: undefined,
      },
      isLoading: false,
      validateAddress: jest.fn(),
    });

    const { result } = renderHook(() =>
      useRecipientAddressModalViewModel({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
      }),
    );

    expect(result.current.showEmptyState).toBe(true);
  });

  it("shows loading state when validation is in progress", () => {
    mockedUseAddressValidation.mockReturnValue({
      result: {
        status: "loading",
        error: null,
        bridgeErrors: {},
        bridgeWarnings: {},
        hasBridgeValidationResult: false,
        matchedAccounts: [],
        matchedContact: undefined,
        resolvedAddress: undefined,
        ensName: undefined,
        isLedgerAccount: false,
        accountName: undefined,
        accountBalance: undefined,
        accountBalanceFormatted: undefined,
        isFirstInteraction: true,
        matchedRecentAddress: undefined,
      },
      isLoading: true,
      validateAddress: jest.fn(),
    });

    const { result } = renderHook(() =>
      useRecipientAddressModalViewModel({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
      }),
    );

    expect(result.current.isLoading).toBe(true);
  });
});
