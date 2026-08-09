import { renderHook, act, waitFor } from "@testing-library/react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { DEFAULT_ZCASH_PRIVATE_INFO } from "@ledgerhq/coin-zcash/constants";
import { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { ZcashAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import { syncStateUpdater } from "../ZCashExportKeyFlowModal/sync";
import { useZcashShieldedSync } from "../useZcashShieldedSync";

jest.mock("LLD/hooks/redux");
jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn(),
}));
jest.mock("../ZCashExportKeyFlowModal/sync", () => ({
  syncStateUpdater: jest.fn(() => ({ type: "test/syncStateUpdater" })),
}));

const mockedUseDispatch = jest.mocked(useDispatch);
const mockedUseSelector = jest.mocked(useSelector);
const mockedGetAccountBridge = jest.mocked(getAccountBridge);
const mockedSyncStateUpdater = jest.mocked(syncStateUpdater);

const baseAccount = createFixtureAccount();
const FAKE_UFVK = "uview1fake-ufvk-for-test";
const DERIVED_ADDRESS = "u1fakederived";

const buildAccount = (overrides: Partial<typeof DEFAULT_ZCASH_PRIVATE_INFO> = {}) =>
  ({
    ...baseAccount,
    type: "Account",
    currency: { id: "zcash" } as CryptoCurrency,
    privateInfo: {
      ...DEFAULT_ZCASH_PRIVATE_INFO,
      ...overrides,
    },
  }) as unknown as ZcashAccount;

const buildNonZcashAccount = () =>
  ({
    ...baseAccount,
    type: "Account",
    currency: { id: "bitcoin" } as CryptoCurrency,
    privateInfo: undefined,
  }) as unknown as ZcashAccount;

describe("useZcashShieldedSync — self-heal effect", () => {
  let mockDispatch: jest.Mock;
  let mockDeriveShieldedAddress: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDispatch = jest.fn();
    mockedUseDispatch.mockReturnValue(mockDispatch);
    mockedUseSelector.mockReturnValue([]);

    mockDeriveShieldedAddress = jest.fn().mockResolvedValue(DERIVED_ADDRESS);
    mockedGetAccountBridge.mockReturnValue({
      deriveShieldedAddress: mockDeriveShieldedAddress,
      sync: jest.fn(),
    } as unknown as ReturnType<typeof getAccountBridge>);
  });

  it("does not call deriveShieldedAddress when no UFVK", async () => {
    const account = buildAccount({ ufvk: null, shieldedAddress: null });
    renderHook(() => useZcashShieldedSync(account));
    await Promise.resolve();
    expect(mockDeriveShieldedAddress).not.toHaveBeenCalled();
  });

  it("does not call deriveShieldedAddress when shieldedAddress already present", async () => {
    const account = buildAccount({ ufvk: FAKE_UFVK, shieldedAddress: DERIVED_ADDRESS });
    renderHook(() => useZcashShieldedSync(account));
    await Promise.resolve();
    expect(mockDeriveShieldedAddress).not.toHaveBeenCalled();
  });

  it("does not call deriveShieldedAddress for non-zcash currency", async () => {
    const account = buildNonZcashAccount();
    renderHook(() => useZcashShieldedSync(account));
    await Promise.resolve();
    expect(mockDeriveShieldedAddress).not.toHaveBeenCalled();
  });

  it("calls deriveShieldedAddress exactly once with the UFVK when address is missing", async () => {
    const account = buildAccount({ ufvk: FAKE_UFVK, shieldedAddress: null });
    renderHook(() => useZcashShieldedSync(account));

    await waitFor(() => {
      expect(mockDeriveShieldedAddress).toHaveBeenCalledTimes(1);
      expect(mockDeriveShieldedAddress).toHaveBeenCalledWith(FAKE_UFVK);
    });
  });

  it("dispatches syncStateUpdater with the derived address on success", async () => {
    const account = buildAccount({ ufvk: FAKE_UFVK, shieldedAddress: null });
    renderHook(() => useZcashShieldedSync(account));

    await waitFor(() => {
      expect(mockedSyncStateUpdater).toHaveBeenCalledWith(
        expect.objectContaining({ id: account.id }),
        { shieldedAddress: DERIVED_ADDRESS },
      );
      expect(mockDispatch).toHaveBeenCalled();
    });
  });

  it("does not dispatch after unmount (cancelled flag prevents stale update)", async () => {
    let resolve!: (value: string) => void;
    mockDeriveShieldedAddress.mockReturnValue(
      new Promise(r => {
        resolve = r;
      }),
    );

    const account = buildAccount({ ufvk: FAKE_UFVK, shieldedAddress: null });
    const { unmount } = renderHook(() => useZcashShieldedSync(account));

    unmount();
    await act(async () => {
      resolve(DERIVED_ADDRESS);
      await Promise.resolve();
    });

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("does not fire a second Zaino call when account re-renders with same ufvk and no shieldedAddress", async () => {
    const account = buildAccount({ ufvk: FAKE_UFVK, shieldedAddress: null });
    const { rerender } = renderHook(() => useZcashShieldedSync(account));

    // Simulate a Redux re-render that produces a new account object reference
    // but identical primitive values (e.g. a sync progress update)
    rerender();
    rerender();

    await waitFor(() => {
      expect(mockDeriveShieldedAddress).toHaveBeenCalledTimes(1);
    });
  });

  it("logs a warning and does not dispatch when derive fails", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockDeriveShieldedAddress.mockRejectedValue(new Error("Zaino unavailable"));

    const account = buildAccount({ ufvk: FAKE_UFVK, shieldedAddress: null });
    renderHook(() => useZcashShieldedSync(account));

    await waitFor(() => {
      expect(warnSpy).toHaveBeenCalledWith(
        "Failed to self-heal shielded address:",
        expect.any(Error),
      );
    });
    expect(mockDispatch).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("account switch: cancels account1 derive, only saves account2 address", async () => {
    // Separate controllable promises so we can sequence resolution precisely.
    let resolveAccount1!: (v: string) => void;
    let resolveAccount2!: (v: string) => void;
    const promise1 = new Promise<string>(r => {
      resolveAccount1 = r;
    });
    const promise2 = new Promise<string>(r => {
      resolveAccount2 = r;
    });

    mockDeriveShieldedAddress.mockReturnValueOnce(promise1).mockReturnValueOnce(promise2);

    const account1 = buildAccount({ ufvk: "ufvk-account-1", shieldedAddress: null });
    const account2 = {
      ...buildAccount({ ufvk: "ufvk-account-2", shieldedAddress: null }),
      id: "account-2-id",
    } as ZcashAccount;

    const { rerender } = renderHook(({ acc }: { acc: ZcashAccount }) => useZcashShieldedSync(acc), {
      initialProps: { acc: account1 },
    });

    // account1's derive is in flight — switch to account2 before it resolves.
    rerender({ acc: account2 });

    // Resolving account1's promise now: cancelled flag is set, must not dispatch.
    await act(async () => {
      resolveAccount1("address-for-account-1");
      await Promise.resolve();
    });
    expect(mockedSyncStateUpdater).not.toHaveBeenCalledWith(
      expect.objectContaining({ id: account1.id }),
      expect.anything(),
    );

    // Resolving account2's promise: should dispatch with account2's address.
    await act(async () => {
      resolveAccount2("address-for-account-2");
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(mockedSyncStateUpdater).toHaveBeenCalledWith(
        expect.objectContaining({ id: account2.id }),
        { shieldedAddress: "address-for-account-2" },
      );
    });
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it("does not call derive when the bridge lacks deriveShieldedAddress", async () => {
    mockedGetAccountBridge.mockReturnValue({
      sync: jest.fn(),
    } as unknown as ReturnType<typeof getAccountBridge>);

    const account = buildAccount({ ufvk: FAKE_UFVK, shieldedAddress: null });
    renderHook(() => useZcashShieldedSync(account));
    await Promise.resolve();

    expect(mockDeriveShieldedAddress).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
