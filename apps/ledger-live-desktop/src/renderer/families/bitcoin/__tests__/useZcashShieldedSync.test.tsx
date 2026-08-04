/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "tests/testSetup";
import { DEFAULT_ZCASH_PRIVATE_INFO } from "@ledgerhq/coin-zcash/constants";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import type { ZcashAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { useZcashShieldedSync } from "../useZcashShieldedSync";

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockDispatch = jest.fn();
const mockDeriveShieldedAddress = jest.fn();
// Stable reference — returned as-is on every render so bridge never changes
// between re-renders, matching production behavior (useAccountBridge caches by account).
const mockBridgeInstance = {
  getFullViewingKey: jest.fn(),
  deriveShieldedAddress: mockDeriveShieldedAddress,
};

jest.mock("LLD/hooks/redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: () => [],
}));

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => mockBridgeInstance,
}));

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn(),
}));

jest.mock("../ZCashExportKeyFlowModal/sync", () => ({
  syncStateUpdater: jest.fn((_account, info) => ({ type: "test/syncState", payload: info })),
}));

jest.mock("~/renderer/actions/accounts", () => ({
  updateAccountWithUpdater: jest.fn(),
}));

jest.mock("~/renderer/reducers/shieldedSyncSubscriptions", () => ({
  selectShieldedSubscriptions: jest.fn(() => []),
  removeShieldedSubscription: jest.fn(),
  upsertShieldedSubscription: jest.fn(),
}));

// ── Helpers ────────────────────────────────────────────────────────────────

const base = createFixtureAccount();

function buildAccount(overrides: Partial<typeof DEFAULT_ZCASH_PRIVATE_INFO> = {}): ZcashAccount {
  return {
    ...base,
    type: "Account",
    currency: { id: "zcash" } as CryptoCurrency,
    privateInfo: { ...DEFAULT_ZCASH_PRIVATE_INFO, ...overrides },
  } as unknown as ZcashAccount;
}

// ── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useZcashShieldedSync — self-heal", () => {
  it("derives and persists shieldedAddress when ufvk is present but address is null", async () => {
    mockDeriveShieldedAddress.mockResolvedValue("utest1healed");
    const account = buildAccount({ ufvk: "uview1testkey", shieldedAddress: null });

    renderHook(() => useZcashShieldedSync(account));

    await waitFor(() => expect(mockDeriveShieldedAddress).toHaveBeenCalledTimes(1));
    expect(mockDeriveShieldedAddress).toHaveBeenCalledWith("uview1testkey");
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ payload: { shieldedAddress: "utest1healed" } }),
    );
  });

  it("does not heal when shieldedAddress is already set", async () => {
    const account = buildAccount({ ufvk: "uview1testkey", shieldedAddress: "utest1already" });

    renderHook(() => useZcashShieldedSync(account));

    await Promise.resolve();
    expect(mockDeriveShieldedAddress).not.toHaveBeenCalled();
  });

  it("does not heal when ufvk is null", async () => {
    const account = buildAccount({ ufvk: null, shieldedAddress: null });

    renderHook(() => useZcashShieldedSync(account));

    await Promise.resolve();
    expect(mockDeriveShieldedAddress).not.toHaveBeenCalled();
  });

  it("does not trigger a second heal on re-render while the first is in flight", async () => {
    let resolveHeal!: (address: string) => void;
    mockDeriveShieldedAddress.mockReturnValue(new Promise(r => (resolveHeal = r)));
    const account = buildAccount({ ufvk: "uview1testkey", shieldedAddress: null });

    const { rerender } = renderHook(() => useZcashShieldedSync(account));
    await Promise.resolve();

    rerender();
    await Promise.resolve();

    resolveHeal("utest1healed");
    await waitFor(() => expect(mockDispatch).toHaveBeenCalled());

    expect(mockDeriveShieldedAddress).toHaveBeenCalledTimes(1);
  });

  it("resets the healing lock on error so the next mount can retry", async () => {
    mockDeriveShieldedAddress.mockRejectedValue(new Error("decode failed"));
    const account = buildAccount({ ufvk: "uview1testkey", shieldedAddress: null });

    const { unmount } = renderHook(() => useZcashShieldedSync(account));
    await waitFor(() => expect(mockDeriveShieldedAddress).toHaveBeenCalledTimes(1));
    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ shieldedAddress: expect.anything() }),
      }),
    );

    unmount();
    mockDeriveShieldedAddress.mockResolvedValue("utest1retry");
    renderHook(() => useZcashShieldedSync(account));

    await waitFor(() => expect(mockDeriveShieldedAddress).toHaveBeenCalledTimes(2));
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ payload: { shieldedAddress: "utest1retry" } }),
    );
  });
});
