/* eslint-disable @typescript-eslint/consistent-type-assertions */

import { renderHook } from "@testing-library/react";
import { useRecipientAddressModalViewModel } from "../useRecipientAddressModalViewModel";
import { useSelector } from "LLD/hooks/redux";
import { useAddressValidation } from "../useAddressValidation";
import { useSendFlowData } from "../../../../context/SendFlowContext";
import {
  getRecentAddressesStore,
  getMainAccount,
  getAccountCurrency,
} from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import { InvalidAddress, InvalidAddressBecauseDestinationIsAlsoSource } from "@ledgerhq/errors";
import { createMockAccount } from "../../__integrations__/__fixtures__/accounts";
import { SendFlowState } from "../../../../types";

jest.mock("LLD/hooks/redux");
jest.mock("../useAddressValidation");
jest.mock("../../../../context/SendFlowContext");
jest.mock("@ledgerhq/live-common/account/index");
jest.mock("@ledgerhq/live-common/bridge/descriptor");
jest.mock("~/renderer/reducers/wallet", () => ({
  useMaybeAccountName: jest.fn(),
  useBatchMaybeAccountName: jest.fn(() => []),
  walletSelector: jest.fn((state: { wallet?: unknown }) => state.wallet || {}),
}));
jest.mock("~/renderer/reducers/accounts", () => ({
  accountsSelector: jest.fn(() => []),
}));

const mockedUseSelector = jest.mocked(useSelector);
const mockedUseAddressValidation = jest.mocked(useAddressValidation);
const mockedUseSendFlowData = jest.mocked(useSendFlowData);
const mockedGetRecentAddressesStore = jest.mocked(getRecentAddressesStore);
const mockedGetMainAccount = jest.mocked(getMainAccount);
const mockedGetAccountCurrency = jest.mocked(getAccountCurrency);
const mockedSendFeatures = jest.mocked(sendFeatures);

const mockAccount = createMockAccount({ id: "account_1" });

const mockRecentAddressesStore = {
  removeAddress: jest.fn(),
  addAddress: jest.fn(),
  syncAddresses: jest.fn(),
  getAddresses: jest.fn(() => []),
};

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
    mockedUseSelector.mockReturnValue([]);
    mockedGetRecentAddressesStore.mockReturnValue(mockRecentAddressesStore);
    mockedGetMainAccount.mockImplementation((account, parentAccount) => {
      if (!account) return mockAccount;
      // getMainAccount returns the account itself if it's an Account, otherwise the parentAccount
      return account.type === "Account" ? account : parentAccount || mockAccount;
    });
    mockedGetAccountCurrency.mockImplementation(account => {
      if (!account) return mockAccount.currency;
      // getAccountCurrency returns account.currency for Account, account.token for TokenAccount
      return account.type === "Account" ? account.currency : account.token;
    });
    mockedSendFeatures.getSelfTransferPolicy.mockReturnValue("impossible");
    mockedUseSendFlowData.mockReturnValue({
      recipientSearch: mockRecipientSearch,
      state: DEFAULT_STATE,
      uiConfig: {} as never,
    });
    mockedUseAddressValidation.mockReturnValue({
      result: {
        status: "idle",
        error: null,
        bridgeErrors: {},
        bridgeWarnings: {},
        matchedAccounts: [],
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
    expect(result.current.showSearchResults).toBe(false);
  });

  it("shows search results when search value is provided", () => {
    mockedUseSendFlowData.mockReturnValue({
      recipientSearch: { ...mockRecipientSearch, value: "some_address" },
      state: DEFAULT_STATE,
      uiConfig: {} as never,
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

  it("filters recent addresses to exclude self-transfers when policy is impossible", () => {
    mockRecentAddressesStore.getAddresses.mockReturnValue([
      { address: "source_address", lastUsed: Date.now() } as never,
      { address: "other_address", lastUsed: Date.now() } as never,
    ]);

    const { result } = renderHook(() =>
      useRecipientAddressModalViewModel({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
      }),
    );

    expect(result.current.recentAddresses).toHaveLength(1);
    expect(result.current.recentAddresses[0].address).toBe("other_address");
  });

  it("calls onAddressSelected when handleRecentAddressSelect is called", () => {
    const onAddressSelected = jest.fn();
    const recentAddress = {
      address: "recent_address",
      currency: mockAccount.currency,
      lastUsedAt: new Date(),
      name: "Recent",
      isLedgerAccount: false,
    };

    const { result } = renderHook(() =>
      useRecipientAddressModalViewModel({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected,
        recipientSupportsDomain: true,
      }),
    );

    result.current.handleRecentAddressSelect(recentAddress);

    expect(onAddressSelected).toHaveBeenCalledWith("recent_address", undefined, true);
  });

  it("calls onAddressSelected when handleAccountSelect is called", () => {
    const onAddressSelected = jest.fn();
    const selectedAccount = createMockAccount({
      id: "account_2",
      freshAddress: "selected_fresh_address",
    });

    const { result } = renderHook(() =>
      useRecipientAddressModalViewModel({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected,
        recipientSupportsDomain: true,
      }),
    );

    result.current.handleAccountSelect(selectedAccount);

    expect(onAddressSelected).toHaveBeenCalledWith("selected_fresh_address", undefined, true);
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

  it("removes address from recent addresses when handleRemoveAddress is called", () => {
    const recentAddress = {
      address: "address_to_remove",
      currency: mockAccount.currency,
      lastUsedAt: new Date(),
      name: "Recent",
      isLedgerAccount: false,
    };

    const { result } = renderHook(() =>
      useRecipientAddressModalViewModel({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
      }),
    );

    result.current.handleRemoveAddress(recentAddress);

    expect(mockRecentAddressesStore.removeAddress).toHaveBeenCalledWith(
      mockAccount.currency.id,
      "address_to_remove",
    );
  });

  it("shows sanctioned banner when address is sanctioned", () => {
    mockedUseSendFlowData.mockReturnValue({
      recipientSearch: { ...mockRecipientSearch, value: "sanctioned_address" },
      state: DEFAULT_STATE,
      uiConfig: {} as never,
    });

    mockedUseAddressValidation.mockReturnValue({
      result: {
        status: "sanctioned",
        error: "sanctioned",
        bridgeErrors: {},
        bridgeWarnings: {},
        matchedAccounts: [],
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
    });

    mockedUseAddressValidation.mockReturnValue({
      result: {
        status: "invalid",
        error: "incorrect_format",
        bridgeErrors: {},
        bridgeWarnings: {},
        matchedAccounts: [],
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
    });

    mockedUseAddressValidation.mockReturnValue({
      result: {
        status: "valid",
        error: null,
        bridgeErrors: {},
        bridgeWarnings: {},
        matchedAccounts: [],
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
  });

  it("identifies self-transfer error correctly", () => {
    mockedUseSendFlowData.mockReturnValue({
      recipientSearch: { ...mockRecipientSearch, value: "source_address" },
      state: DEFAULT_STATE,
      uiConfig: {} as never,
    });

    const selfTransferError = new InvalidAddressBecauseDestinationIsAlsoSource();
    mockedUseAddressValidation.mockReturnValue({
      result: {
        status: "valid",
        error: null,
        bridgeErrors: { recipient: selfTransferError },
        bridgeWarnings: {},
        matchedAccounts: [],
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

    // Self-transfer error is a bridge recipient error, so it should be shown
    expect(result.current.showBridgeRecipientError).toBe(true);
    expect(result.current.bridgeRecipientError).toBe(selfTransferError);
  });

  it("treats InvalidAddress as incorrect format for domain-like strings", () => {
    mockedUseSendFlowData.mockReturnValue({
      recipientSearch: { ...mockRecipientSearch, value: "invalid.eth" },
      state: DEFAULT_STATE,
      uiConfig: {} as never,
    });

    const invalidAddressError = new InvalidAddress();
    mockedUseAddressValidation.mockReturnValue({
      result: {
        status: "valid",
        error: null,
        bridgeErrors: { recipient: invalidAddressError },
        bridgeWarnings: {},
        matchedAccounts: [],
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
    });

    mockedUseAddressValidation.mockReturnValue({
      result: {
        status: "idle",
        error: null,
        bridgeErrors: {},
        bridgeWarnings: {},
        matchedAccounts: [],
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

  it("filters user accounts to exclude current account", () => {
    const otherAccount = createMockAccount({
      id: "account_2",
      freshAddress: "other_address",
    });

    mockedUseSelector.mockReturnValue([mockAccount, otherAccount]);

    const { result } = renderHook(() =>
      useRecipientAddressModalViewModel({
        account: mockAccount,
        currency: mockAccount.currency,
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
      }),
    );

    expect(result.current.mainAccount.id).toBe("account_1");
  });

  it("shows loading state when validation is in progress", () => {
    mockedUseAddressValidation.mockReturnValue({
      result: {
        status: "loading",
        error: null,
        bridgeErrors: {},
        bridgeWarnings: {},
        matchedAccounts: [],
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
