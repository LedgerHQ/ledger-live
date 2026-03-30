/* eslint-disable @typescript-eslint/consistent-type-assertions */

import { renderHook } from "@testing-library/react";
import { useRecipientAddressModalViewModel } from "../useRecipientAddressModalViewModel";
import { useAddressValidation } from "../useAddressValidation";
import { useSendFlowData } from "../../../../context/SendFlowContext";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { InvalidAddress, InvalidAddressBecauseDestinationIsAlsoSource } from "@ledgerhq/errors";
import { createMockAccount } from "../../__integrations__/__fixtures__/accounts";
import { SendFlowState } from "@ledgerhq/live-common/flows/send/types";

jest.mock("../useAddressValidation");
jest.mock("../../../../context/SendFlowContext");
jest.mock("@ledgerhq/live-common/account/index");
jest.mock("@ledgerhq/live-common/bridge/descriptor/send/features");
jest.mock("~/renderer/reducers/wallet", () => ({
  useMaybeAccountName: jest.fn(),
  useBatchMaybeAccountName: jest.fn(() => []),
  walletSelector: jest.fn((state: { wallet?: unknown }) => state.wallet || {}),
}));

const mockedUseAddressValidation = jest.mocked(useAddressValidation);
const mockedUseSendFlowData = jest.mocked(useSendFlowData);
const mockedGetMainAccount = jest.mocked(getMainAccount);
const mockedSendFeatures = jest.mocked(sendFeatures);

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
    expect(result.current.showEmptyState).toBe(false);
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
