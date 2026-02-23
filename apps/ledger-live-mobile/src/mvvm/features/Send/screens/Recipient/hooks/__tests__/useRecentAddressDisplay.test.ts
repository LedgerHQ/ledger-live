import { renderHook } from "@testing-library/react-native";
import { useRecentAddressDisplay } from "../useRecentAddressDisplay";
import { useSelector } from "~/context/hooks";
import { useMaybeAccountName } from "~/reducers/wallet";
import type { RecentAddress } from "@ledgerhq/live-common/flows/send/recipient/types";
import { LedgerLogo, Wallet } from "@ledgerhq/lumen-ui-rnative/symbols";
import { createMockAccount, createMockCurrency } from "./accounts";

jest.mock("~/context/hooks");
jest.mock("~/reducers/wallet");
jest.mock("../useFormatRelativeDate");

const mockedUseSelector = jest.mocked(useSelector);
const mockedUseMaybeAccountName = jest.mocked(useMaybeAccountName);

const mockAccount = createMockAccount({ id: "account_1" });
const mockCurrency = createMockCurrency();

const createMockRecentAddress = (overrides?: Partial<RecentAddress>): RecentAddress => ({
  address: "0x1234567890abcdef1234567890abcdef12345678",
  currency: mockCurrency,
  lastUsedAt: new Date("2025-01-15T12:00:00Z"),
  ...overrides,
});

describe("useRecentAddressDisplay", () => {
  const mockFormatRelativeDate = jest.fn((_date: Date) => "2 hours ago");

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSelector.mockReturnValue([mockAccount]);
    mockedUseMaybeAccountName.mockReturnValue("My Bitcoin Account");
    jest
      .requireMock("../useFormatRelativeDate")
      .useFormatRelativeDate.mockReturnValue(mockFormatRelativeDate);
  });

  it("returns LedgerLogo icon for Ledger account", () => {
    const recentAddress = createMockRecentAddress({
      isLedgerAccount: true,
      accountId: mockAccount.id,
    });

    const { result } = renderHook(() => useRecentAddressDisplay(recentAddress));

    expect(result.current.icon).toBe(LedgerLogo);
  });

  it("returns Wallet icon for non-Ledger account", () => {
    const recentAddress = createMockRecentAddress({ isLedgerAccount: false });

    const { result } = renderHook(() => useRecentAddressDisplay(recentAddress));

    expect(result.current.icon).toBe(Wallet);
  });

  it("uses ensName as displayName when present", () => {
    const recentAddress = createMockRecentAddress({
      ensName: "vitalik.eth",
      name: "Custom Name",
    });

    const { result } = renderHook(() => useRecentAddressDisplay(recentAddress));

    expect(result.current.displayName).toBe("vitalik.eth");
  });

  it("uses account name as displayName for Ledger account when no ensName", () => {
    const recentAddress = createMockRecentAddress({
      isLedgerAccount: true,
      accountId: mockAccount.id,
    });
    mockedUseMaybeAccountName.mockReturnValue("My Bitcoin Account");

    const { result } = renderHook(() => useRecentAddressDisplay(recentAddress));

    expect(result.current.displayName).toBe("My Bitcoin Account");
  });

  it("uses recentAddress.name as displayName when not Ledger account and no ensName", () => {
    const recentAddress = createMockRecentAddress({
      name: "Saved Contact",
      isLedgerAccount: false,
    });

    const { result } = renderHook(() => useRecentAddressDisplay(recentAddress));

    expect(result.current.displayName).toBe("Saved Contact");
  });

  it("uses formatted address as displayName when no ensName, account name, or name", () => {
    const recentAddress = createMockRecentAddress({
      isLedgerAccount: false,
      address: "0x1234567890abcdef1234567890abcdef12345678",
    });

    const { result } = renderHook(() => useRecentAddressDisplay(recentAddress));

    // formatAddress with prefixLength: 5, suffixLength: 4 produces e.g. "0x123...5678"
    expect(result.current.displayName).toMatch(/0x123\.\.\.5678/);
  });

  it("uses formatted address when Ledger account but account not found in selector", () => {
    mockedUseSelector.mockReturnValue([]);
    const recentAddress = createMockRecentAddress({
      isLedgerAccount: true,
      accountId: "non_existent_account",
    });
    mockedUseMaybeAccountName.mockReturnValue(undefined);

    const { result } = renderHook(() => useRecentAddressDisplay(recentAddress));

    expect(result.current.displayName).toMatch(/0x123\.\.\.5678/);
  });

  it("returns dateText from useFormatRelativeDate", () => {
    const lastUsedAt = new Date("2025-01-15T12:00:00Z");
    const recentAddress = createMockRecentAddress({ lastUsedAt });
    mockFormatRelativeDate.mockReturnValue("3 days ago");

    const { result } = renderHook(() => useRecentAddressDisplay(recentAddress));

    expect(result.current.dateText).toBe("3 days ago");
    expect(mockFormatRelativeDate).toHaveBeenCalledWith(lastUsedAt);
  });
});
