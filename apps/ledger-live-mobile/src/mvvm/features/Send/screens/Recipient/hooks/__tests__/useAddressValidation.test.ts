import { renderHook, waitFor } from "@testing-library/react-native";
import { useAddressValidation } from "../useAddressValidation";
import { useDomain } from "@ledgerhq/domain-service/hooks/index";
import { isAddressSanctioned } from "@ledgerhq/ledger-wallet-framework/sanction/index";
import { InvalidAddressBecauseDestinationIsAlsoSource } from "@ledgerhq/errors";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useBridgeRecipientValidation } from "@ledgerhq/live-common/flows/send/recipient/hooks/useBridgeRecipientValidation";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { createMockAccount, createMockCurrency } from "./accounts";

jest.mock("@ledgerhq/domain-service/hooks/index");
jest.mock("@ledgerhq/ledger-wallet-framework/sanction/index");
jest.mock("@ledgerhq/live-common/account/index");
jest.mock("@ledgerhq/live-common/flows/send/recipient/hooks/useBridgeRecipientValidation");
jest.mock("@ledgerhq/live-common/bridge/descriptor/send/features");

const mockedUseDomain = jest.mocked(useDomain);
const mockedIsAddressSanctioned = jest.mocked(isAddressSanctioned);
const mockedGetMainAccount = jest.mocked(getMainAccount);
const mockedUseBridgeRecipientValidation = jest.mocked(useBridgeRecipientValidation);
const mockedSendFeatures = jest.mocked(sendFeatures);

const mockAccount = createMockAccount({ id: "account_1" });
const mockEthereumAccount = createMockAccount({
  id: "eth_account_1",
  currency: createMockCurrency({ id: "ethereum", name: "Ethereum", ticker: "ETH" }),
  freshAddress: "0x123",
});

describe("useAddressValidation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseDomain.mockReturnValue({ status: "loaded", resolutions: [], updatedAt: Date.now() });
    mockedIsAddressSanctioned.mockResolvedValue(false);
    mockedGetMainAccount.mockImplementation((account, parentAccount) => {
      if (!account) return mockAccount;
      // getMainAccount returns the account itself if it's an Account, otherwise the parentAccount
      return account.type === "Account" ? account : parentAccount || mockAccount;
    });
    mockedUseBridgeRecipientValidation.mockReturnValue({
      errors: {},
      warnings: {},
      isLoading: false,
      status: null,
      cleanup: jest.fn(),
    });
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
      }),
    );

    expect(result.current.isLoading).toBe(true);
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
      }),
    );

    expect(result.current.result.bridgeErrors?.recipient).toBeInstanceOf(
      InvalidAddressBecauseDestinationIsAlsoSource,
    );
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
});
