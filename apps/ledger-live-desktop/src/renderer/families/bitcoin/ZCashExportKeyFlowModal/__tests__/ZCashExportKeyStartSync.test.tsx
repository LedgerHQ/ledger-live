import React from "react";
import { Observable } from "rxjs";
import { render, screen, userEvent, waitFor } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { DEFAULT_ZCASH_PRIVATE_INFO } from "@ledgerhq/coin-zcash/constants";
import { CryptoCurrency } from "@domain/entity-currency-crypto";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { SYNC_TYPE_SHIELDED } from "@ledgerhq/types-live";
import type { Account } from "@ledgerhq/types-live";
import type { ZcashAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import ExportKeyModal from "../index";

jest.mock("@ledgerhq/live-common/bridge/index", () => {
  const actual = jest.requireActual<Record<PropertyKey, unknown>>(
    "@ledgerhq/live-common/bridge/index",
  );
  const overrides: Record<PropertyKey, unknown> = { __esModule: true, getAccountBridge: jest.fn() };
  return new Proxy(overrides, { get: (o, k) => (k in o ? o[k] : actual[k]) });
});
const mockedGetAccountBridge = jest.mocked(getAccountBridge);

jest.mock("~/renderer/components/Modal", () => {
  const actual = jest.requireActual("~/renderer/components/Modal");
  const MockModal = ({
    render: renderContent,
  }: {
    render?: (args: { onClose: () => void; data: unknown }) => React.ReactNode;
  }) => <>{renderContent?.({ onClose: jest.fn(), data: {} })}</>;

  return { ...actual, __esModule: true, default: MockModal };
});

// Stands in for the stepper so the two confirmation-step CTAs can be driven
// directly; StepConfirmation's own mapping of those buttons to the
// startSyncNow flag is covered in ZCashExportKeyFlowModal.test.tsx.
jest.mock("../Body", () => {
  return function MockBody({
    onUfvkChanged,
    handleEnableShieldedBalance,
  }: {
    onUfvkChanged: (ufvk: string, shieldedAddress?: string | null) => void;
    handleEnableShieldedBalance: (options: { startSyncNow: boolean }) => void;
  }) {
    return (
      <div>
        <button type="button" onClick={() => onUfvkChanged("test-ufvk", "test-shielded-address")}>
          set ufvk
        </button>
        <button type="button" onClick={() => handleEnableShieldedBalance({ startSyncNow: true })}>
          Start sync
        </button>
        <button type="button" onClick={() => handleEnableShieldedBalance({ startSyncNow: false })}>
          Close
        </button>
      </div>
    );
  };
});

const zcashAccount = {
  ...createFixtureAccount(),
  currency: { id: "zcash" } as CryptoCurrency,
  privateInfo: { ...DEFAULT_ZCASH_PRIVATE_INFO, syncState: "disabled", ufvk: null },
} as unknown as ZcashAccount;

const renderModal = () =>
  render(<ExportKeyModal account={zcashAccount} />, {
    initialState: { accounts: [zcashAccount], shieldedSyncSubscriptions: [] },
  });

const accountFromStore = (state: { accounts: Account[] }): ZcashAccount =>
  state.accounts.find(a => a.id === zcashAccount.id) as ZcashAccount;

describe("ZCash Export UFVK Flow - starting the sync from the modal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetAccountBridge.mockReturnValue({
      sync: jest.fn(() => new Observable(subscriber => subscriber.next((a: unknown) => a))),
    } as unknown as ReturnType<typeof getAccountBridge>);
  });

  // The regression: "Start sync" used to only write syncState "running" to redux.
  // Nothing registered the rxjs subscription that actually advances the scan, and
  // startShieldedSync — the only thing that could — refuses to run once it sees
  // "running", so the account sat on a 0% spinner until the user stopped and
  // restarted the sync by hand.
  it("registers a shielded sync subscription when starting the sync", async () => {
    const { store } = renderModal();

    await userEvent.click(screen.getByRole("button", { name: /set ufvk/i }));
    await userEvent.click(screen.getByRole("button", { name: /start sync/i }));

    await waitFor(() => {
      expect(store.getState().shieldedSyncSubscriptions).toEqual([
        {
          accountId: zcashAccount.id,
          subscription: expect.objectContaining({ unsubscribe: expect.any(Function) }),
        },
      ]);
    });

    const bridge = mockedGetAccountBridge.mock.results[0].value;
    expect(bridge.sync).toHaveBeenCalledWith(
      expect.objectContaining({ id: zcashAccount.id }),
      expect.objectContaining({ syncType: SYNC_TYPE_SHIELDED }),
    );

    const account = accountFromStore(store.getState());
    expect(account.privateInfo?.ufvk).toBe("test-ufvk");
    expect(account.privateInfo?.syncState).toBe("running");
  });

  // Closing only enables private balance. Leaving syncState "ready" is what keeps
  // the account-page CTA a working "Start sync" rather than a "Stop sync" for a
  // sync that was never running.
  it("enables private balance without starting a sync when closing", async () => {
    const { store } = renderModal();

    await userEvent.click(screen.getByRole("button", { name: /set ufvk/i }));
    await userEvent.click(screen.getByRole("button", { name: /close/i }));

    await waitFor(() => {
      const account = accountFromStore(store.getState());
      expect(account.privateInfo?.ufvk).toBe("test-ufvk");
      expect(account.privateInfo?.syncState).toBe("ready");
    });

    expect(store.getState().shieldedSyncSubscriptions).toEqual([]);
    expect(mockedGetAccountBridge).not.toHaveBeenCalled();
  });
});
