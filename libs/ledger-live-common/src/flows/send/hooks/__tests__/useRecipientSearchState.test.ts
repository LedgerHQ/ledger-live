/**
 * @jest-environment jsdom
 */
import { InvalidAddress, InvalidAddressBecauseDestinationIsAlsoSource } from "@ledgerhq/errors";
import { renderHook } from "@testing-library/react";
import type { AddressSearchResult } from "../../types";
import { useRecipientSearchState } from "../useRecipientSearchState";

const createDefaultResult = (overrides?: Partial<AddressSearchResult>): AddressSearchResult =>
  ({
    status: "idle",
    error: null,
    resolvedAddress: undefined,
    ensName: undefined,
    isLedgerAccount: false,
    accountName: undefined,
    accountBalance: undefined,
    accountBalanceFormatted: undefined,
    isFirstInteraction: true,
    matchedRecentAddress: undefined,
    matchedAccounts: [],
    bridgeErrors: undefined,
    bridgeWarnings: undefined,
    ...overrides,
  }) as AddressSearchResult;

const defaultProps = {
  searchValue: "",
  result: createDefaultResult(),
  isLoading: false,
  recipientSupportsDomain: false,
};

describe("useRecipientSearchState", () => {
  it("should hide search results when search value is empty", () => {
    const { result } = renderHook(() =>
      useRecipientSearchState({
        ...defaultProps,
        searchValue: "",
      }),
    );

    expect(result.current.showSearchResults).toBe(false);
    expect(result.current.showMatchedAddress).toBe(false);
    expect(result.current.showAddressValidationError).toBe(false);
    expect(result.current.showEmptyState).toBe(false);
  });

  it("should hide search results when loading", () => {
    const { result } = renderHook(() =>
      useRecipientSearchState({
        ...defaultProps,
        searchValue: "0x123",
        isLoading: true,
      }),
    );

    expect(result.current.showSearchResults).toBe(false);
  });

  it("should show search results when has search value and not loading", () => {
    const { result } = renderHook(() =>
      useRecipientSearchState({
        ...defaultProps,
        searchValue: "0xabc",
        isLoading: false,
      }),
    );

    expect(result.current.showSearchResults).toBe(true);
  });

  it("should set isAddressComplete for valid status", () => {
    const { result } = renderHook(() =>
      useRecipientSearchState({
        ...defaultProps,
        searchValue: "0xvalid",
        result: createDefaultResult({ status: "valid" }),
      }),
    );

    expect(result.current.isAddressComplete).toBe(true);
  });

  it("should set isAddressComplete for ens_resolved status", () => {
    const { result } = renderHook(() =>
      useRecipientSearchState({
        ...defaultProps,
        searchValue: "vitalik.eth",
        result: createDefaultResult({ status: "ens_resolved" }),
        recipientSupportsDomain: true,
      }),
    );

    expect(result.current.isAddressComplete).toBe(true);
  });

  it("should set isAddressComplete for sanctioned status", () => {
    const { result } = renderHook(() =>
      useRecipientSearchState({
        ...defaultProps,
        searchValue: "0xsanctioned",
        result: createDefaultResult({ status: "sanctioned" }),
      }),
    );

    expect(result.current.isAddressComplete).toBe(true);
    expect(result.current.isSanctioned).toBe(true);
  });

  it("should not set isAddressComplete for idle or invalid status", () => {
    const { result: idleResult } = renderHook(() =>
      useRecipientSearchState({
        ...defaultProps,
        searchValue: "0x",
        result: createDefaultResult({ status: "idle" }),
      }),
    );
    expect(idleResult.current.isAddressComplete).toBe(false);

    const { result: invalidResult } = renderHook(() =>
      useRecipientSearchState({
        ...defaultProps,
        searchValue: "bad",
        result: createDefaultResult({ status: "invalid" }),
      }),
    );
    expect(invalidResult.current.isAddressComplete).toBe(false);
  });

  it("should show sanctioned banner when address is sanctioned and has search value", () => {
    const { result } = renderHook(() =>
      useRecipientSearchState({
        ...defaultProps,
        searchValue: "0xsanctioned",
        result: createDefaultResult({ status: "sanctioned" }),
      }),
    );

    expect(result.current.showSanctionedBanner).toBe(true);
    expect(result.current.isSanctioned).toBe(true);
  });

  it("should show address validation error when result has error and no matches", () => {
    const { result } = renderHook(() =>
      useRecipientSearchState({
        ...defaultProps,
        searchValue: "invalid",
        result: createDefaultResult({
          status: "invalid",
          error: "incorrect_format",
        }),
      }),
    );

    expect(result.current.showAddressValidationError).toBe(true);
    expect(result.current.addressValidationErrorType).toBe("incorrect_format");
  });

  it("should show address validation error for bridge InvalidAddress and return incorrect_format when no dot", () => {
    const { result } = renderHook(() =>
      useRecipientSearchState({
        ...defaultProps,
        searchValue: "invalidaddr",
        result: createDefaultResult({
          status: "valid",
          bridgeErrors: { recipient: new InvalidAddress() },
        }),
      }),
    );

    expect(result.current.showAddressValidationError).toBe(true);
    expect(result.current.addressValidationErrorType).toBe("incorrect_format");
  });

  it("should return wallet_not_exist when bridge InvalidAddress and search contains dot", () => {
    const { result } = renderHook(() =>
      useRecipientSearchState({
        ...defaultProps,
        searchValue: "foo.bar.eth",
        result: createDefaultResult({
          status: "valid",
          bridgeErrors: { recipient: new InvalidAddress() },
        }),
      }),
    );

    expect(result.current.addressValidationErrorType).toBe("wallet_not_exist");
  });

  it("should not treat InvalidAddressBecauseDestinationIsAlsoSource as bridge invalid address", () => {
    const { result } = renderHook(() =>
      useRecipientSearchState({
        ...defaultProps,
        searchValue: "0xself",
        result: createDefaultResult({
          status: "valid",
          bridgeErrors: {
            recipient: new InvalidAddressBecauseDestinationIsAlsoSource(),
          },
        }),
      }),
    );

    expect(result.current.showAddressValidationError).toBe(false);
    expect(result.current.bridgeRecipientError).toBeInstanceOf(
      InvalidAddressBecauseDestinationIsAlsoSource,
    );
  });

  it("should show matched address when result is valid with no error", () => {
    const { result } = renderHook(() =>
      useRecipientSearchState({
        ...defaultProps,
        searchValue: "0xvalid",
        result: createDefaultResult({
          status: "valid",
          error: null,
        }),
      }),
    );

    expect(result.current.showMatchedAddress).toBe(true);
  });

  it("should show matched address when has matchedRecentAddress", () => {
    const recent = {
      address: "0xrecent",
      currency: {} as never,
      lastUsedAt: new Date(),
    };
    const { result } = renderHook(() =>
      useRecipientSearchState({
        ...defaultProps,
        searchValue: "0xrecent",
        result: createDefaultResult({
          status: "valid",
          matchedRecentAddress: recent,
        }),
      }),
    );

    expect(result.current.showMatchedAddress).toBe(true);
  });

  it("should show matched address when isLedgerAccount", () => {
    const { result } = renderHook(() =>
      useRecipientSearchState({
        ...defaultProps,
        searchValue: "0xledger",
        result: createDefaultResult({
          status: "valid",
          isLedgerAccount: true,
        }),
      }),
    );

    expect(result.current.showMatchedAddress).toBe(true);
  });

  it("should show empty state when search has value but no matches and no error", () => {
    const { result } = renderHook(() =>
      useRecipientSearchState({
        ...defaultProps,
        searchValue: "0xunknown",
        result: createDefaultResult({
          status: "idle",
          matchedAccounts: [],
          matchedRecentAddress: undefined,
          ensName: undefined,
          isLedgerAccount: false,
        }),
      }),
    );

    expect(result.current.showEmptyState).toBe(true);
    expect(result.current.showMatchedAddress).toBe(false);
    expect(result.current.showAddressValidationError).toBe(false);
  });

  it("should expose bridge recipient warning", () => {
    const warning = new Error("Low balance");
    const { result } = renderHook(() =>
      useRecipientSearchState({
        ...defaultProps,
        searchValue: "0xwarn",
        result: createDefaultResult({
          status: "valid",
          bridgeWarnings: { recipient: warning },
        }),
      }),
    );

    expect(result.current.bridgeRecipientWarning).toBe(warning);
  });

  it("should show bridge sender error when present", () => {
    const senderError = new Error("Insufficient balance");
    const { result } = renderHook(() =>
      useRecipientSearchState({
        ...defaultProps,
        searchValue: "0xaddr",
        result: createDefaultResult({
          status: "valid",
          bridgeErrors: { sender: senderError },
        }),
      }),
    );

    expect(result.current.bridgeSenderError).toBe(senderError);
    expect(result.current.showBridgeSenderError).toBe(true);
  });

  it("should show bridge recipient error when no matches and not invalid address", () => {
    const recipientError = new Error("Bridge recipient error");
    const { result } = renderHook(() =>
      useRecipientSearchState({
        ...defaultProps,
        searchValue: "0xaddr",
        result: createDefaultResult({
          status: "valid",
          matchedAccounts: [],
          matchedRecentAddress: undefined,
          ensName: undefined,
          isLedgerAccount: false,
          bridgeErrors: { recipient: recipientError },
        }),
      }),
    );

    expect(result.current.showBridgeRecipientError).toBe(true);
    expect(result.current.bridgeRecipientError).toBe(recipientError);
  });

  it("should show bridge recipient warning when no recipient error and no address validation error", () => {
    const warning = new Error("Warning");
    const { result } = renderHook(() =>
      useRecipientSearchState({
        ...defaultProps,
        searchValue: "0xvalid",
        result: createDefaultResult({
          status: "valid",
          bridgeWarnings: { recipient: warning },
        }),
      }),
    );

    expect(result.current.showBridgeRecipientWarning).toBe(true);
  });
});
