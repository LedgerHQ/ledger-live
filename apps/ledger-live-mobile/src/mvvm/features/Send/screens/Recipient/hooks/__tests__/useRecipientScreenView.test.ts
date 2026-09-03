import { act, renderHook } from "@testing-library/react-native";
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
import { useSendFlowTracking } from "../../../../context/SendFlowTrackingContext";
import { useContactsFeatureIntroductionViewModel } from "../useContactsFeatureIntroductionViewModel";
import { screen as trackScreen, track } from "~/analytics";

jest.mock("../useAddressValidation");
jest.mock("../useClipboardRecipient");
jest.mock("../../../../context/SendFlowContext");
jest.mock("@ledgerhq/live-common/account/index");
jest.mock("@features/platform-contacts", () => ({
  useContacts: jest.fn(),
  useContactsFeature: jest.fn(),
}));
jest.mock("../../../../context/RecipientContactSelectionContext");
jest.mock("../../../../context/SendFlowTrackingContext");
jest.mock("../useContactsFeatureIntroductionViewModel");
jest.mock("~/analytics", () => ({
  track: jest.fn(),
  screen: jest.fn(),
}));

const mockedUseAddressValidation = jest.mocked(useAddressValidation);
const mockedUseClipboardRecipient = jest.mocked(useClipboardRecipient);
const mockedUseSendFlowData = jest.mocked(useSendFlowData);
const mockedGetMainAccount = jest.mocked(getMainAccount);
const mockedUseContacts = jest.mocked(useContacts);
const mockedUseContactsFeature = jest.mocked(useContactsFeature);
const mockedUseRecipientContactSelection = jest.mocked(useRecipientContactSelection);
const mockedUseSendFlowTracking = jest.mocked(useSendFlowTracking);
const mockedUseContactsFeatureIntroductionViewModel = jest.mocked(
  useContactsFeatureIntroductionViewModel,
);
const mockedTrackScreen = jest.mocked(trackScreen);
const mockedTrack = jest.mocked(track);
const setRecipientResolution = jest.fn();
const resetRecipientResolution = jest.fn();
const setInputMethod = jest.fn();

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

function mockContactAddressValidation() {
  let searchValue = "";
  let validationResult: AddressSearchResult = idleResult;
  const setValue = jest.fn((value: string) => {
    searchValue = value;
  });
  mockedUseSendFlowData.mockImplementation(() => ({
    recipientSearch: { ...mockRecipientSearch, value: searchValue, setValue },
    state: {} as never,
    uiConfig: {} as never,
  }));
  mockedUseAddressValidation.mockImplementation(() => ({
    result: validationResult,
    isLoading: false,
    validateAddress: jest.fn(),
  }));
  return {
    setValue,
    markAddressValid() {
      validationResult = {
        ...idleResult,
        status: "valid",
        hasBridgeValidationResult: true,
      };
    },
  };
}

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
    mockedUseSendFlowTracking.mockReturnValue({
      inputMethod: "manual",
      resultType: null,
      recipientType: null,
      savedContactDuringFlow: false,
      setInputMethod,
      setRecipientResolution,
      resetRecipientResolution,
      markContactSaved: jest.fn(),
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

  it("tracks a settled recipient result without exposing the raw query", () => {
    mockedUseSendFlowData.mockReturnValue({
      recipientSearch: { ...mockRecipientSearch, value: "0x123" },
      state: {} as never,
      uiConfig: {} as never,
    });
    mockedUseAddressValidation.mockReturnValue({
      result: { ...idleResult, status: "valid", resolvedAddress: "0x123" },
      isLoading: false,
      validateAddress: jest.fn(),
    });

    renderHook(() =>
      useRecipientScreenView({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
      }),
    );

    expect(mockedTrackScreen).toHaveBeenCalledWith(
      "Modal send - recipient result",
      undefined,
      expect.objectContaining({
        queryType: "address",
        resultType: "unknown address",
        inputMethod: "manual",
        queryLength: 5,
        addressAlreadyUsed: false,
      }),
    );
    expect(setRecipientResolution).toHaveBeenCalledWith("unknown address", "external address");
    expect(mockedTrackScreen.mock.calls[0]?.[2]).not.toHaveProperty("query");
  });

  it("clears the tracked recipient resolution when the search input becomes empty", () => {
    let searchValue = "0x123";
    mockedUseSendFlowData.mockImplementation(() => ({
      recipientSearch: { ...mockRecipientSearch, value: searchValue },
      state: {} as never,
      uiConfig: {} as never,
    }));
    mockedUseAddressValidation.mockReturnValue({
      result: { ...idleResult, status: "valid", resolvedAddress: "0x123" },
      isLoading: false,
      validateAddress: jest.fn(),
    });

    const { rerender } = renderHook(() =>
      useRecipientScreenView({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
      }),
    );

    expect(setRecipientResolution).toHaveBeenCalledTimes(1);
    expect(resetRecipientResolution).not.toHaveBeenCalled();

    searchValue = "";
    rerender(undefined);

    expect(resetRecipientResolution).toHaveBeenCalledTimes(1);

    searchValue = "0x123";
    rerender(undefined);

    expect(setRecipientResolution).toHaveBeenCalledTimes(2);
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

  it("validates the address matching the current currency among network addresses", () => {
    const onAddressSelected = jest.fn();
    const { setValue, markAddressValid } = mockContactAddressValidation();
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

    const { result, rerender } = renderHook(() =>
      useRecipientScreenView({
        account: mockAccount,
        currency: createMockTokenCurrency(),
        onAddressSelected,
        recipientSupportsDomain: true,
      }),
    );

    act(() => result.current.handleContactSelect(contact));

    expect(setValue).toHaveBeenCalledWith("0xusdt");
    expect(onAddressSelected).not.toHaveBeenCalled();

    markAddressValid();
    rerender(undefined);

    expect(onAddressSelected).toHaveBeenCalledWith("0xusdt", undefined);
  });

  it("validates the only compatible contact address before continuing", () => {
    const onAddressSelected = jest.fn();
    const selectContact = jest.fn();
    const { setValue, markAddressValid } = mockContactAddressValidation();
    mockedUseRecipientContactSelection.mockReturnValue({
      selectedContact: undefined,
      selectContact,
      clearSelectedContact: jest.fn(),
    });
    const contact = mockContact({
      addresses: [
        mockContactAddress({
          currencyId: "ethereum",
          address: "0x1234567890123456789012345678901234567890",
        }),
      ],
    });

    const { result, rerender } = renderHook(() =>
      useRecipientScreenView({
        account: mockAccount,
        currency: createMockCurrency({ id: "ethereum" }),
        onAddressSelected,
        recipientSupportsDomain: true,
      }),
    );

    act(() => result.current.handleContactSelect(contact));

    expect(setValue).toHaveBeenCalledWith("0x1234567890123456789012345678901234567890");
    expect(onAddressSelected).not.toHaveBeenCalled();
    expect(selectContact).not.toHaveBeenCalled();

    markAddressValid();
    rerender(undefined);

    expect(onAddressSelected).toHaveBeenCalledWith(
      "0x1234567890123456789012345678901234567890",
      undefined,
    );
  });

  it.each([
    ["invalid", "incorrect_format"],
    ["sanctioned", "sanctioned"],
  ] as const)("does not continue with a %s contact address", (status, error) => {
    const onAddressSelected = jest.fn();
    let searchValue = "";
    const setValue = jest.fn((value: string) => {
      searchValue = value;
    });
    mockedUseSendFlowData.mockImplementation(() => ({
      recipientSearch: { ...mockRecipientSearch, value: searchValue, setValue },
      state: {} as never,
      uiConfig: {} as never,
    }));
    mockedUseAddressValidation.mockReturnValue({
      result: { ...idleResult, status, error },
      isLoading: false,
      validateAddress: jest.fn(),
    });
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

    expect(setValue).toHaveBeenCalledWith("0x1234567890123456789012345678901234567890");
    expect(onAddressSelected).not.toHaveBeenCalled();
  });

  it("opens address selection when a contact has several compatible addresses", () => {
    const onAddressSelected = jest.fn();
    const selectContact = jest.fn();
    mockedUseRecipientContactSelection.mockReturnValue({
      selectedContact: undefined,
      selectContact,
      clearSelectedContact: jest.fn(),
    });
    const contact = mockContact({
      addresses: [
        mockContactAddress({ id: "address-one", currencyId: "ethereum" }),
        mockContactAddress({ id: "address-two", currencyId: "ethereum" }),
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

    expect(mockedTrack).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "contact",
        page: "step recipient",
        addressCount: 2,
      }),
    );
    expect(mockedTrackScreen).toHaveBeenCalledWith(
      "Modal send - select contact address",
      undefined,
      expect.objectContaining({ addressCount: 2 }),
    );
    expect(selectContact).toHaveBeenCalledWith(contact);
    expect(onAddressSelected).not.toHaveBeenCalled();
  });

  it("opens address selection when several network addresses remain without a currency match", () => {
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
      useRecipientScreenView({
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

  it("validates the chosen address after contact address selection", () => {
    const onAddressSelected = jest.fn();
    const clearSelectedContact = jest.fn();
    const { setValue, markAddressValid } = mockContactAddressValidation();
    mockedUseRecipientContactSelection.mockReturnValue({
      selectedContact: undefined,
      selectContact: jest.fn(),
      clearSelectedContact,
    });

    const { result, rerender } = renderHook(() =>
      useRecipientScreenView({
        account: mockAccount,
        currency: createMockCurrency({ id: "ethereum" }),
        onAddressSelected,
        recipientSupportsDomain: true,
      }),
    );

    act(() =>
      result.current.handleContactAddressSelect(mockContactAddress({ address: "0x456" }), 1),
    );

    expect(mockedTrack).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "contact address",
        page: "select contact address",
        addressRank: 1,
      }),
    );
    expect(clearSelectedContact).toHaveBeenCalledTimes(1);
    expect(setValue).toHaveBeenCalledWith("0x456");
    expect(onAddressSelected).not.toHaveBeenCalled();

    markAddressValid();
    rerender(undefined);

    expect(onAddressSelected).toHaveBeenCalledWith("0x456", undefined);
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

    expect(setInputMethod).toHaveBeenCalledWith("paste");
    expect(mockedTrack).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "paste", page: "step recipient" }),
    );
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
