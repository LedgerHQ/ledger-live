import { renderHook, waitFor } from "@testing-library/react";
import { useAddressValidation } from "../useAddressValidation";
import { useSelector } from "LLD/hooks/redux";
import { useDomain } from "@ledgerhq/domain-service/hooks/index";
import { isAddressSanctioned } from "@ledgerhq/coin-framework/sanction/index";
import {
  getRecentAddressesStore,
  getMainAccount,
  getAccountCurrency,
} from "@ledgerhq/live-common/account/index";
import { useBridgeRecipientValidation } from "../useBridgeRecipientValidation";
import { useFormattedAccountBalance } from "../useFormattedAccountBalance";
import { useMaybeAccountName, useBatchMaybeAccountName } from "~/renderer/reducers/wallet";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import {
  createMockAccount,
  createMockCurrency,
} from "../../__integrations__/__fixtures__/accounts";

jest.mock("LLD/hooks/redux");
jest.mock("@ledgerhq/domain-service/hooks/index");
jest.mock("@ledgerhq/coin-framework/sanction/index");
jest.mock("@ledgerhq/live-common/account/index");
jest.mock("../useBridgeRecipientValidation");
jest.mock("../useFormattedAccountBalance");
jest.mock("~/renderer/reducers/wallet");
jest.mock("@ledgerhq/live-common/bridge/descriptor");

const mockedUseSelector = jest.mocked(useSelector);
const mockedUseDomain = jest.mocked(useDomain);
const mockedIsAddressSanctioned = jest.mocked(isAddressSanctioned);
const mockedGetRecentAddressesStore = jest.mocked(getRecentAddressesStore);
const mockedGetMainAccount = jest.mocked(getMainAccount);
const mockedGetAccountCurrency = jest.mocked(getAccountCurrency);
const mockedUseBridgeRecipientValidation = jest.mocked(useBridgeRecipientValidation);
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

  it("resolves ENS names for Ethereum", async () => {
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

  it("shows loading state during ENS resolution", () => {
    mockedUseDomain.mockReturnValue({
      status: "loading",
    });

    const { result } = renderHook(() =>
      useAddressValidation({
        searchValue: "test.eth",
        currency: createMockCurrency({ id: "ethereum", name: "Ethereum", ticker: "ETH" }),
        account: mockEthereumAccount,
      }),
    );

    expect(result.current.isLoading).toBe(true);
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

  it("shows loading during bridge validation", () => {
    mockedUseBridgeRecipientValidation.mockReturnValue({
      errors: {},
      warnings: {},
      isLoading: true,
      status: null,
      cleanup: jest.fn(),
    });

    const { result } = renderHook(() =>
      useAddressValidation({
        searchValue: "address",
        currency: mockAccount.currency,
        account: mockAccount,
      }),
    );

    expect(result.current.isLoading).toBe(true);
  });

  it("resets state when search value is cleared", async () => {
    const { result, rerender } = renderHook(
      ({ searchValue }) =>
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
      }),
    );

    expect(mockedUseBridgeRecipientValidation).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: "0xResolved",
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
