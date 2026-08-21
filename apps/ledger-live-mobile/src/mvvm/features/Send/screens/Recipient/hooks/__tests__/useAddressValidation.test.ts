import { renderHook, waitFor } from "@testing-library/react-native";
import { useAddressValidation } from "../useAddressValidation";
import { useSelector } from "~/context/hooks";
import { useDomain } from "@ledgerhq/domain-service/hooks/index";
import { isAddressSanctioned } from "@ledgerhq/ledger-wallet-framework/sanction/index";
import { InvalidAddressBecauseDestinationIsAlsoSource } from "@ledgerhq/ledger-wallet-framework/errors";
import {
  getRecentAddressesStore,
  getMainAccount,
  getAccountCurrency,
} from "@ledgerhq/live-common/account/index";
import { useBridgeRecipientValidation } from "@ledgerhq/live-common/flows/send/recipient/hooks/useBridgeRecipientValidation";
import { findMatchedContact } from "@ledgerhq/live-common/flows/send/recipient/utils/findMatchedContact";
import { genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { mockContact, mockContactAddress } from "@domain/entity-contact/schema.mock";
import { useFormattedAccountBalance } from "LLM/hooks/useFormattedAccountBalance";
import { accountsSelector } from "~/reducers/accounts";
import { useMaybeAccountName, useBatchMaybeAccountName } from "~/reducers/wallet";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { createMockAccount, createMockCurrency, createMockTokenCurrency } from "./accounts";

jest.mock("~/context/hooks");
jest.mock("~/reducers/wallet");
jest.mock("@ledgerhq/domain-service/hooks/index");
jest.mock("@ledgerhq/ledger-wallet-framework/sanction/index");
jest.mock("@ledgerhq/live-common/account/index");
jest.mock("@ledgerhq/live-common/flows/send/recipient/hooks/useBridgeRecipientValidation");
jest.mock("@ledgerhq/live-common/flows/send/recipient/utils/findMatchedContact");
jest.mock("LLM/hooks/useFormattedAccountBalance");
jest.mock("@ledgerhq/live-common/bridge/descriptor/send/features");

const mockedUseSelector = jest.mocked(useSelector);
const mockedUseDomain = jest.mocked(useDomain);
const mockedIsAddressSanctioned = jest.mocked(isAddressSanctioned);
const mockedGetRecentAddressesStore = jest.mocked(getRecentAddressesStore);
const mockedGetMainAccount = jest.mocked(getMainAccount);
const mockedGetAccountCurrency = jest.mocked(getAccountCurrency);
const mockedUseBridgeRecipientValidation = jest.mocked(useBridgeRecipientValidation);
const mockedFindMatchedContact = jest.mocked(findMatchedContact);
const mockedUseFormattedAccountBalance = jest.mocked(useFormattedAccountBalance);
const mockedUseMaybeAccountName = jest.mocked(useMaybeAccountName);
const mockedUseBatchMaybeAccountName = jest.mocked(useBatchMaybeAccountName);
const mockedSendFeatures = jest.mocked(sendFeatures);

const mockAccount = createMockAccount({ id: "account_1" });
const mockEthereumAccount = createMockAccount({
  id: "eth_account_1",
  currency: createMockCurrency({ id: "ethereum", name: "Ethereum", ticker: "ETH" }),
  freshAddress: "0x123",
});

const mockRecentAddressesStore = {
  addAddress: jest.fn(),
  removeAddress: jest.fn(),
  syncAddresses: jest.fn(),
  getAddresses: jest.fn(() => []),
};

describe("useAddressValidation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSelector.mockReturnValue([]);
    mockedUseDomain.mockReturnValue({ status: "loaded", resolutions: [], updatedAt: Date.now() });
    mockedIsAddressSanctioned.mockResolvedValue(false);
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
    mockedUseBridgeRecipientValidation.mockReturnValue({
      errors: {},
      warnings: {},
      isLoading: false,
      status: null,
      cleanup: jest.fn(),
    });
    mockedUseFormattedAccountBalance.mockReturnValue({
      formattedBalance: "1 BTC",
      formattedCounterValue: "$50,000",
    });
    mockedUseMaybeAccountName.mockReturnValue("My Account");
    mockedUseBatchMaybeAccountName.mockReturnValue([]);
    mockedSendFeatures.getSelfTransferPolicy.mockReturnValue("impossible");
    mockedFindMatchedContact.mockReturnValue(undefined);
  });

  it("returns idle status for empty search", () => {
    const { result } = renderHook(() =>
      useAddressValidation({
        searchValue: "",
        currency: mockAccount.currency,
        account: mockAccount,
      }),
    );

    expect(result.current.result.status).toBe("idle");
    expect(result.current.isLoading).toBe(false);
  });

  it("validates a valid address", async () => {
    const { result } = renderHook(() =>
      useAddressValidation({
        searchValue: "valid_address",
        currency: mockAccount.currency,
        account: mockAccount,
      }),
    );

    await waitFor(() => {
      expect(result.current.result.status).toBe("valid");
    });
  });

  it("detects sanctioned addresses", async () => {
    mockedIsAddressSanctioned.mockResolvedValue(true);

    const { result } = renderHook(() =>
      useAddressValidation({
        searchValue: "sanctioned_address",
        currency: mockAccount.currency,
        account: mockAccount,
      }),
    );

    await waitFor(() => {
      expect(result.current.result.status).toBe("sanctioned");
      expect(result.current.result.error).toBe("sanctioned");
    });
  });

  it("checks token recipients against the parent currency sanctions", async () => {
    const tokenCurrency = createMockTokenCurrency();
    const tokenAccount = genTokenAccount(0, mockEthereumAccount, tokenCurrency);
    mockedIsAddressSanctioned.mockResolvedValue(true);

    const { result } = renderHook(() =>
      useAddressValidation({
        searchValue: "sanctioned_address",
        currency: tokenCurrency,
        account: tokenAccount,
        parentAccount: mockEthereumAccount,
      }),
    );

    await waitFor(() => {
      expect(result.current.result.status).toBe("sanctioned");
    });
    expect(mockedIsAddressSanctioned).toHaveBeenCalledWith(
      mockEthereumAccount.currency,
      "sanctioned_address",
    );
  });

  it("resolves ENS names when recipientSupportsDomain is true", async () => {
    const ensResolution = {
      domain: "vitalik.eth",
      address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      type: "forward" as const,
      registry: "ens" as const,
    };

    mockedUseDomain.mockReturnValue({
      status: "loaded",
      resolutions: [ensResolution],
      updatedAt: Date.now(),
    });

    const { result } = renderHook(() =>
      useAddressValidation({
        searchValue: "vitalik.eth",
        currency: createMockCurrency({ id: "ethereum", name: "Ethereum", ticker: "ETH" }),
        account: mockEthereumAccount,
        recipientSupportsDomain: true,
      }),
    );

    await waitFor(() => {
      expect(result.current.result.status).toBe("ens_resolved");
      expect(result.current.result.ensName).toBe("vitalik.eth");
      expect(result.current.result.resolvedAddress).toBe(
        "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      );
    });
  });

  it("revalidates sanctions against the resolved ENS address", async () => {
    const ensResolution = {
      domain: "sanctioned.eth",
      address: "0xSanctioned",
      type: "forward" as const,
      registry: "ens" as const,
    };
    const validationProps = {
      searchValue: ensResolution.domain,
      currency: mockEthereumAccount.currency,
      account: mockEthereumAccount,
      recipientSupportsDomain: true,
    };
    mockedUseDomain.mockReturnValue({ status: "loading" });
    mockedIsAddressSanctioned.mockImplementation(
      async (_currency, address) => address === ensResolution.address,
    );

    const { result, rerender } = renderHook(
      (props: typeof validationProps) => useAddressValidation(props),
      { initialProps: validationProps },
    );

    await waitFor(() => {
      expect(mockedIsAddressSanctioned).toHaveBeenCalledWith(
        mockEthereumAccount.currency,
        ensResolution.domain,
      );
    });

    mockedUseDomain.mockReturnValue({
      status: "loaded",
      resolutions: [ensResolution],
      updatedAt: Date.now(),
    });
    rerender(validationProps);

    await waitFor(() => {
      expect(result.current.result.status).toBe("sanctioned");
    });
    expect(mockedIsAddressSanctioned).toHaveBeenCalledWith(
      mockEthereumAccount.currency,
      ensResolution.address,
    );
  });

  it("shows loading state during ENS resolution", () => {
    mockedUseDomain.mockReturnValue({
      status: "loading",
    });

    const { result } = renderHook(() =>
      useAddressValidation({
        searchValue: "test.eth",
        currency: createMockCurrency({ id: "ethereum", name: "Ethereum", ticker: "ETH" }),
        account: mockEthereumAccount,
        recipientSupportsDomain: true,
        canSearchContactsByName: true,
      }),
    );

    expect(result.current.isLoading).toBe(true);
    expect(mockedFindMatchedContact).toHaveBeenCalledWith([], "test.eth", "ethereum", undefined, {
      matchName: false,
    });
  });

  it("matches user accounts by address", () => {
    const otherAccount = createMockAccount({
      id: "account_2",
      freshAddress: "matching_address",
    });

    mockedUseSelector.mockReturnValue([mockAccount, otherAccount]);
    mockedUseBatchMaybeAccountName.mockReturnValue(["Account 1", "Account 2"]);

    const { result } = renderHook(() =>
      useAddressValidation({
        searchValue: "matching",
        currency: mockAccount.currency,
        account: mockAccount,
        currentAccountId: mockAccount.id,
      }),
    );

    expect(result.current.result.matchedAccounts).toHaveLength(1);
    expect(result.current.result.matchedAccounts?.[0].account.id).toBe("account_2");
  });

  it("matches recent addresses", () => {
    mockRecentAddressesStore.getAddresses.mockReturnValue([
      {
        address: "recent_matching_address",
        lastUsed: Date.now(),
      } as never,
    ]);

    const { result } = renderHook(() =>
      useAddressValidation({
        searchValue: "recent_matching",
        currency: mockAccount.currency,
        account: mockAccount,
      }),
    );

    expect(result.current.result.matchedRecentAddress).toBeDefined();
    expect(result.current.result.matchedRecentAddress?.address).toBe("recent_matching_address");
  });

  it("matches a saved contact by resolved address", () => {
    const contactAddress = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
    const remiContact = mockContact({
      id: "contact-remi",
      name: "Remi",
      addresses: [
        mockContactAddress({
          id: "address-remi-ethereum",
          currencyId: "ethereum",
          label: "Ethereum Network",
          address: contactAddress,
        }),
      ],
    });
    const matchedContact = {
      contactId: "contact-remi",
      contactName: "Remi",
      addressId: "address-remi-ethereum",
      addressLabel: "Ethereum Network",
      address: contactAddress,
    };

    mockedUseSelector.mockImplementation(selector =>
      selector === accountsSelector ? [mockEthereumAccount] : [remiContact],
    );
    mockedFindMatchedContact.mockReturnValue(matchedContact);

    mockedUseDomain.mockReturnValue({
      status: "loaded",
      resolutions: [
        { domain: "vitalik.eth", address: contactAddress, registry: "ens", type: "forward" },
      ],
      updatedAt: Date.now(),
    });

    const { result } = renderHook(() =>
      useAddressValidation({
        searchValue: "vitalik.eth",
        currency: mockEthereumAccount.currency,
        account: mockEthereumAccount,
        recipientSupportsDomain: true,
      }),
    );

    expect(result.current.result.matchedContact).toEqual(matchedContact);
    expect(result.current.result.ensName).toBe("vitalik.eth");
    expect(mockedFindMatchedContact).toHaveBeenCalledWith(
      [remiContact],
      "vitalik.eth",
      "ethereum",
      contactAddress,
      { matchName: false },
    );
  });

  it("validates a contact name using the contact address", async () => {
    const contactAddress = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
    mockedFindMatchedContact.mockReturnValue({
      contactId: "contact-benoit",
      contactName: "Benoit",
      addressId: "address-benoit-ethereum",
      addressLabel: "Ethereum Network",
      address: contactAddress,
    });

    const { result } = renderHook(() =>
      useAddressValidation({
        searchValue: "Benoit",
        currency: mockEthereumAccount.currency,
        account: mockEthereumAccount,
        recipientSupportsDomain: true,
        canSearchContactsByName: true,
      }),
    );

    await waitFor(() => {
      expect(result.current.result.status).toBe("valid");
    });
    expect(result.current.result.resolvedAddress).toBe(contactAddress);
    expect(mockedUseBridgeRecipientValidation).toHaveBeenCalledWith(
      expect.objectContaining({ recipient: contactAddress }),
    );
    expect(mockedIsAddressSanctioned).toHaveBeenCalledWith(
      mockEthereumAccount.currency,
      contactAddress,
    );
  });

  it("excludes current account from matches when self-transfer is impossible", () => {
    mockedSendFeatures.getSelfTransferPolicy.mockReturnValue("impossible");

    const otherAccount = createMockAccount({
      id: "account_2",
      freshAddress: "other_address",
    });

    mockedUseSelector.mockReturnValue([mockAccount, otherAccount]);

    const { result } = renderHook(() =>
      useAddressValidation({
        searchValue: "address",
        currency: mockAccount.currency,
        account: mockAccount,
        currentAccountId: mockAccount.id,
      }),
    );

    const matchedIds = result.current.result.matchedAccounts?.map(m => m.account.id) || [];
    expect(matchedIds).not.toContain(mockAccount.id);
  });

  it("includes current account match when self-transfer is allowed", () => {
    mockedSendFeatures.getSelfTransferPolicy.mockReturnValue("free");

    const { result } = renderHook(() =>
      useAddressValidation({
        searchValue: "source_address",
        currency: mockAccount.currency,
        account: mockAccount,
        currentAccountId: mockAccount.id,
      }),
    );

    expect(result.current.result.matchedAccounts).toHaveLength(1);
    expect(result.current.result.matchedAccounts?.[0].account.id).toBe(mockAccount.id);
  });

  it("includes current account match by name when self-transfer is allowed", () => {
    mockedSendFeatures.getSelfTransferPolicy.mockReturnValue("free");
    mockedUseMaybeAccountName.mockReturnValue("Ethereum 3");

    const { result } = renderHook(() =>
      useAddressValidation({
        searchValue: "Ethereum 3",
        currency: mockAccount.currency,
        account: mockAccount,
        currentAccountId: mockAccount.id,
      }),
    );

    expect(result.current.result.matchedAccounts).toHaveLength(1);
    expect(result.current.result.matchedAccounts?.[0].account.id).toBe(mockAccount.id);
  });

  it("searches by account name", () => {
    const namedAccount = createMockAccount({
      id: "account_2",
      freshAddress: "named_account_address",
    });

    // Mock the selector to return both accounts
    mockedUseSelector.mockReturnValue([mockAccount, namedAccount]);
    // useBatchMaybeAccountName is called with userAccountsForCurrency which excludes currentAccount
    // So it only receives namedAccount
    mockedUseBatchMaybeAccountName.mockReturnValue(["My Savings Account"]);

    const { result } = renderHook(() =>
      useAddressValidation({
        searchValue: "savings",
        currency: mockAccount.currency,
        account: mockAccount,
        currentAccountId: mockAccount.id,
      }),
    );

    // The hook filters accounts by currency and excludes current account
    // Then searches by name in the remaining accounts
    expect(result.current.result.matchedAccounts).toHaveLength(1);
    expect(result.current.result.matchedAccounts?.[0].account.id).toBe("account_2");
  });

  it("includes bridge validation errors", () => {
    const recipientError = new Error("Invalid recipient");
    mockedUseBridgeRecipientValidation.mockReturnValue({
      errors: { recipient: recipientError },
      warnings: {},
      isLoading: false,
      status: null,
      cleanup: jest.fn(),
    });

    const { result } = renderHook(() =>
      useAddressValidation({
        searchValue: "invalid_address",
        currency: mockAccount.currency,
        account: mockAccount,
      }),
    );

    expect(result.current.result.bridgeErrors?.recipient).toBe(recipientError);
  });

  it("includes bridge validation warnings", () => {
    const recipientWarning = new Error("Low balance");
    mockedUseBridgeRecipientValidation.mockReturnValue({
      errors: {},
      warnings: { recipient: recipientWarning },
      isLoading: false,
      status: null,
      cleanup: jest.fn(),
    });

    const { result } = renderHook(() =>
      useAddressValidation({
        searchValue: "valid_address",
        currency: mockAccount.currency,
        account: mockAccount,
      }),
    );

    expect(result.current.result.bridgeWarnings?.recipient).toBe(recipientWarning);
  });

  it("injects a self-transfer error when policy is impossible and recipient is the current account", () => {
    mockedSendFeatures.getSelfTransferPolicy.mockReturnValue("impossible");
    mockedUseBridgeRecipientValidation.mockReturnValue({
      errors: {},
      warnings: {},
      isLoading: false,
      status: null,
      cleanup: jest.fn(),
    });

    const { result } = renderHook(() =>
      useAddressValidation({
        searchValue: mockAccount.freshAddress,
        currency: mockAccount.currency,
        account: mockAccount,
        currentAccountId: mockAccount.id,
      }),
    );

    expect(result.current.result.bridgeErrors?.recipient).toBeInstanceOf(
      InvalidAddressBecauseDestinationIsAlsoSource,
    );
  });

  it("surfaces bridge loading only while awaiting the first result for the recipient", () => {
    mockedUseBridgeRecipientValidation.mockReturnValue({
      errors: {},
      warnings: {},
      isLoading: true,
      status: null,
      cleanup: jest.fn(),
    });

    const validationProps = {
      searchValue: "address",
      currency: mockAccount.currency,
      account: mockAccount,
    };

    const { result, rerender } = renderHook(
      (props: typeof validationProps) => useAddressValidation(props),
      { initialProps: validationProps },
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.result.isBridgeLoading).toBe(true);

    mockedUseBridgeRecipientValidation.mockReturnValue({
      errors: {},
      warnings: {},
      isLoading: true,
      // Bridge already settled once for this recipient (revalidation in progress).
      status: { errors: {}, warnings: {} } as never,
      cleanup: jest.fn(),
    });
    rerender(validationProps);

    expect(result.current.result.isBridgeLoading).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("resets state when search value is cleared", async () => {
    const { result, rerender } = renderHook(
      ({ searchValue }: { searchValue: string }) =>
        useAddressValidation({
          searchValue,
          currency: mockAccount.currency,
          account: mockAccount,
        }),
      { initialProps: { searchValue: "test" } },
    );

    await waitFor(() => {
      expect(result.current.result.status).toBe("valid");
    });

    rerender({ searchValue: "" });

    expect(result.current.result.status).toBe("idle");
    expect(result.current.result.error).toBeNull();
  });

  it("marks first interaction when no matches exist", async () => {
    const { result } = renderHook(() =>
      useAddressValidation({
        searchValue: "new_unique_address",
        currency: mockAccount.currency,
        account: mockAccount,
      }),
    );

    await waitFor(() => {
      expect(result.current.result.isFirstInteraction).toBe(true);
    });
  });

  it("marks not first interaction when matches exist", () => {
    mockRecentAddressesStore.getAddresses.mockReturnValue([
      {
        address: "known_address",
        lastUsed: Date.now(),
      } as never,
    ]);

    const { result } = renderHook(() =>
      useAddressValidation({
        searchValue: "known",
        currency: mockAccount.currency,
        account: mockAccount,
      }),
    );

    expect(result.current.result.isFirstInteraction).toBe(false);
  });

  it("handles validation errors gracefully", async () => {
    mockedIsAddressSanctioned.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() =>
      useAddressValidation({
        searchValue: "address",
        currency: mockAccount.currency,
        account: mockAccount,
      }),
    );

    await waitFor(() => {
      expect(result.current.result.status).toBe("invalid");
      expect(result.current.result.error).toBe("incorrect_format");
    });
  });

  it("uses ENS resolved address for bridge validation", () => {
    const ensResolution = {
      domain: "test.eth",
      address: "0xResolved",
      type: "forward" as const,
      registry: "ens" as const,
    };

    mockedUseDomain.mockReturnValue({
      status: "loaded",
      resolutions: [ensResolution],
      updatedAt: Date.now(),
    });

    renderHook(() =>
      useAddressValidation({
        searchValue: "test.eth",
        currency: createMockCurrency({ id: "ethereum", name: "Ethereum", ticker: "ETH" }),
        account: mockEthereumAccount,
        recipientSupportsDomain: true,
      }),
    );

    expect(mockedUseBridgeRecipientValidation).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: "0xResolved",
      }),
    );
  });

  it("passes the current transaction to bridge validation", () => {
    const transaction = { family: "bitcoin", recipient: "" } as Transaction;

    renderHook(() =>
      useAddressValidation({
        searchValue: "valid_address",
        currency: mockAccount.currency,
        account: mockAccount,
        transaction,
      }),
    );

    expect(mockedUseBridgeRecipientValidation).toHaveBeenCalledWith(
      expect.objectContaining({
        transaction,
      }),
    );
  });

  it("filters currency-specific accounts", () => {
    const btcAccount = createMockAccount({ id: "btc_1" });
    const ethAccount = createMockAccount({
      id: "eth_1",
      currency: createMockCurrency({ id: "ethereum", name: "Ethereum", ticker: "ETH" }),
      freshAddress: "0xEth",
    });

    mockedUseSelector.mockReturnValue([btcAccount, ethAccount]);

    const { result } = renderHook(() =>
      useAddressValidation({
        searchValue: "eth",
        currency: mockAccount.currency,
        account: mockAccount,
        currentAccountId: btcAccount.id,
      }),
    );

    const matchedIds = result.current.result.matchedAccounts?.map(m => m.account.id) || [];
    expect(matchedIds).not.toContain("eth_1");
  });
});
