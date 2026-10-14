import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import {
  getWalletApiIdFromAccountId,
  setWalletApiIdForAccountId,
} from "@ledgerhq/live-common/wallet-api/converters";
import { cancelMigrationRequest } from "@ledgerhq/live-common/wallet-api/Perps/migrationRequest";
import { act, render, renderHook, screen } from "tests/testSetup";
import { setDrawer } from "~/renderer/drawers/Provider";
import { usePerpsHandlers } from "../hooks/usePerpsHandlers";

jest.mock("~/renderer/drawers/Provider", () => ({
  __esModule: true,
  ...jest.requireActual("~/renderer/drawers/Provider"),
  setDrawer: jest.fn(),
}));

// The device is connected as soon as the connect step shows up.
jest.mock("~/renderer/components/DeviceAction", () => {
  const { useEffect } = jest.requireActual("react");
  return {
    __esModule: true,
    default: ({ onResult }: { onResult: (result: unknown) => void }) => {
      useEffect(() => onResult({ device: { deviceId: "device-1" } }), [onResult]);
      return null;
    },
  };
});

jest.mock("~/renderer/bridge/cache", () => ({
  prepareCurrency: jest.fn().mockResolvedValue(null),
}));

let triggerNext: (account: Account) => void = () => null;
let triggerComplete: () => void = () => null;

jest.mock("@ledgerhq/live-common/bridge/index", () => {
  const { Observable } = jest.requireActual("rxjs");
  return {
    __esModule: true,
    getCurrencyBridge: () => ({
      scanAccounts: () =>
        new Observable((subscriber: { next: (e: unknown) => void; complete: () => void }) => {
          triggerNext = account => subscriber.next({ account });
          triggerComplete = () => subscriber.complete();
          return () => {};
        }),
      preload: () => Promise.resolve(true),
      hydrate: () => true,
    }),
    getAccountBridge: () => ({
      isAccountEmpty: (a: Account) => a.operationsCount === 0 && a.balance.isZero(),
    }),
  };
});

const legacyAccount = genAccount("perps-legacy", { currency: getCryptoCurrencyById("arbitrum") });
const existingHypercoreAccount = genAccount("perps-hc-existing", {
  currency: getCryptoCurrencyById("hypercore"),
});
const discoveredHypercoreAccount = genAccount("perps-hc-discovered", {
  currency: getCryptoCurrencyById("hypercore"),
});

type MigrateAccount = (req: {
  params: { legacyAccountId: string };
}) => Promise<{ accounts: { accountId: string; created: boolean }[] }>;

function setup(accounts: Account[]) {
  accounts.forEach(account => setWalletApiIdForAccountId(account.id));
  const view = renderHook(() => usePerpsHandlers(accounts), { initialState: { accounts } });
  const migrateAccount = view.result.current["custom.perps.migrateAccount"] as MigrateAccount;
  const request = migrateAccount({
    params: { legacyAccountId: getWalletApiIdFromAccountId(legacyAccount.id) },
  });
  // Tests await it themselves; this only keeps a failing test from crashing the worker.
  request.catch(() => {});
  return { ...view, request };
}

/** Renders the drawer the migration opened, as the drawer provider would. */
function renderOpenedDrawer(store: ReturnType<typeof setup>["store"]) {
  const [Component, props] = jest.mocked(setDrawer).mock.calls[0];
  if (!Component) throw new Error("the migration did not open a drawer");
  return render(<Component {...props} />, { store });
}

async function scan(accounts: Account[]) {
  await act(async () => {});
  for (const account of accounts) {
    await act(() => triggerNext(account));
  }
  await act(() => triggerComplete());
}

describe("Perps migration integration", () => {
  beforeEach(() => jest.mocked(setDrawer).mockClear());
  afterEach(() => cancelMigrationRequest());

  describe("when the wallet has no Hyperliquid account", () => {
    it("adds the account the user selects and hands it to the live app as created", async () => {
      const { request, store } = setup([legacyAccount]);
      const { user } = renderOpenedDrawer(store);

      await scan([discoveredHypercoreAccount]);

      const confirm = screen.getByRole("button", { name: "Confirm" });
      expect(confirm).toBeDisabled();

      await user.click(screen.getAllByTestId(/^account-row-/)[0]);
      await user.click(confirm);

      await expect(request).resolves.toEqual({
        accounts: [
          { accountId: getWalletApiIdFromAccountId(discoveredHypercoreAccount.id), created: true },
        ],
      });
      expect(store.getState().accounts.map((a: Account) => a.id)).toContain(
        discoveredHypercoreAccount.id,
      );

      await user.click(screen.getByRole("button", { name: "Done" }));
      expect(setDrawer).toHaveBeenLastCalledWith();
    });

    it("cancels when the flow is closed before anything is added", async () => {
      const { request, store } = setup([legacyAccount]);
      const { unmount } = renderOpenedDrawer(store);

      await scan([discoveredHypercoreAccount]);
      unmount();

      await expect(request).rejects.toBeInstanceOf(UserRefusedOnDevice);
      expect(store.getState().accounts).toHaveLength(1);
    });
  });

  describe("when the wallet already has a Hyperliquid account", () => {
    it("hands the account the user picks to the live app as not created", async () => {
      const { request, store } = setup([legacyAccount, existingHypercoreAccount]);

      const params = store.getState().modularDialog.dialogParams;
      expect(params?.currencies).toEqual(["hypercore"]);
      act(() => params?.onAccountSelected?.(existingHypercoreAccount));

      await expect(request).resolves.toEqual({
        accounts: [
          { accountId: getWalletApiIdFromAccountId(existingHypercoreAccount.id), created: false },
        ],
      });
      expect(setDrawer).not.toHaveBeenCalled();
    });

    it("runs the discovery flow from the selector's Add account", async () => {
      const { request, store } = setup([legacyAccount, existingHypercoreAccount]);

      act(() => store.getState().modularDialog.dialogParams?.onAddAccount?.());
      expect(store.getState().modularDialog.isOpen).toBe(false);

      const { user } = renderOpenedDrawer(store);
      await scan([discoveredHypercoreAccount]);
      await user.click(screen.getAllByTestId(/^account-row-/)[0]);
      await user.click(screen.getByRole("button", { name: "Confirm" }));

      await expect(request).resolves.toEqual({
        accounts: [
          { accountId: getWalletApiIdFromAccountId(discoveredHypercoreAccount.id), created: true },
        ],
      });
    });

    it("cancels when the user closes the selector", async () => {
      const { request, store } = setup([legacyAccount, existingHypercoreAccount]);

      act(() => store.getState().modularDialog.dialogParams?.onClose?.());

      await expect(request).rejects.toBeInstanceOf(UserRefusedOnDevice);
    });
  });
});
