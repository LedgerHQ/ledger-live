/* eslint-disable @typescript-eslint/consistent-type-assertions */

import { renderHook } from "@testing-library/react";
import { useRecipientAddressModalViewModel } from "../useRecipientAddressModalViewModel";
import { useAddressValidation } from "../useAddressValidation";
import { useAddressMatchedSectionViewModel } from "../useAddressMatchedSectionViewModel";
import { useSendFlowData } from "../../../../context/SendFlowContext";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { useContactsFeature } from "@features/flow-contacts";
import { useContacts } from "@features/platform-contacts";
import {
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
} from "@ledgerhq/ledger-wallet-framework/errors";
import {
  createMockAccount,
  createMockCurrency,
} from "../../__integrations__/__fixtures__/accounts";
import type { SendFlowState } from "@ledgerhq/live-common/flows/send/types";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { mockContact, mockContactAddress } from "@domain/entity-contact/schema.mock";

jest.mock("../useAddressValidation");
jest.mock("../useAddressMatchedSectionViewModel");
jest.mock("../../../../context/SendFlowContext");
jest.mock("../../../../../FlowWizard/FlowWizardContext", () => ({
  useFlowWizard: () => ({ navigation: { goToStep: jest.fn() } }),
}));
jest.mock("@ledgerhq/live-common/account/index");
jest.mock("@ledgerhq/live-common/bridge/descriptor/send/features");
jest.mock("@features/platform-contacts");
jest.mock("@features/flow-contacts", () => ({
  useContactsFeature: jest.fn(),
}));
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

const mockAccount = createMockAccount({ id: "account_1" });

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

describe("useRecipientAddressModalViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetMainAccount.mockImplementation((account, parentAccount) => {
      if (!account) return mockAccount;
      return account.type === "Account" ? account : parentAccount || mockAccount;
    });
    mockedSendFeatures.hasMemo.mockReturnValue(false);
    mockedSendFeatures.hasAddressBook.mockReturnValue(false);
    mockedUseContacts.mockReturnValue([]);
    mockedUseContactsFeature.mockReturnValue({
      isEnabled: false,
      showNewBadge: false,
      eligibleAddressFamilies: [],
    });
    mockedUseSendFlowData.mockReturnValue({
      recipientSearch: mockRecipientSearch,
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
    mockedUseAddressMatchedSectionViewModel.mockReturnValue({
      isVisible: false,
      showHeader: false,
      addressMatchedLabel: "",
      suggestion: null,
      showFirstInteractionWarning: false,
    });
  });

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

  it("shows empty contacts state when address book is enabled and no contact matches the network", () => {
    mockedSendFeatures.hasAddressBook.mockReturnValue(true);
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
  });

  it("does not show empty contacts state when address book is not supported", () => {
    mockedSendFeatures.hasAddressBook.mockReturnValue(false);
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
  });

  it("does not show empty contacts state when a contact matches the network", () => {
    mockedSendFeatures.hasAddressBook.mockReturnValue(true);
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
    expect(result.current.showEmptyContactsState).toBe(false);
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
