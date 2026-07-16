import { renderHook } from "@testing-library/react-native";
import { useRecipientScreenView } from "../useRecipientScreenView";
import { useAddressValidation } from "../useAddressValidation";
import { useClipboardRecipient } from "../useClipboardRecipient";
import { useSendFlowData } from "../../../../context/SendFlowContext";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { InvalidAddress, InvalidAddressBecauseDestinationIsAlsoSource } from "@ledgerhq/errors";
import { createMockAccount } from "./accounts";

jest.mock("../useAddressValidation");
jest.mock("../useClipboardRecipient");
jest.mock("../../../../context/SendFlowContext");
jest.mock("@ledgerhq/live-common/account/index");

const mockedUseAddressValidation = jest.mocked(useAddressValidation);
const mockedUseClipboardRecipient = jest.mocked(useClipboardRecipient);
const mockedUseSendFlowData = jest.mocked(useSendFlowData);
const mockedGetMainAccount = jest.mocked(getMainAccount);

const mockAccount = createMockAccount({ id: "account_1" });

const mockRecipientSearch = {
  value: "",
  setValue: jest.fn(),
  clear: jest.fn(),
};

const idleResult = {
  status: "idle" as const,
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
  isFirstInteraction: false,
  matchedRecentAddress: undefined,
};

describe("useRecipientScreenView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetMainAccount.mockImplementation((account, parentAccount) => {
      if (!account) return mockAccount;
      // getMainAccount returns the account itself if it's an Account, otherwise the parentAccount
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
  });

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
      result: { ...idleResult, status: "valid" },
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

    // Self-transfer error is a bridge recipient error, so it should be shown
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
