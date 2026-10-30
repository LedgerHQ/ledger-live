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

// Spied, not stubbed: the drawer provider must still see the add account drawer open and close.
jest.mock("~/renderer/drawers/Provider", () => {
  const actual = jest.requireActual("~/renderer/drawers/Provider");
  return {
    __esModule: true,
    ...actual,
    setDrawer: jest.fn((...args: unknown[]) => actual.setDrawer(...args)),
  };
});

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
const hypercoreAt = (id: string, freshAddress: string): Account => ({
  ...genAccount(id, { currency: getCryptoCurrencyById("hypercore") }),
  freshAddress,
});
const matchingAccount = hypercoreAt("perps-hc-matching", legacyAccount.freshAddress);
const otherAccount = hypercoreAt("perps-hc-other", "0x0000000000000000000000000000000000000002");

type MigrateAccount = (req: {
  params: { legacyAccountId: string };
}) => Promise<{ accounts: { accountId: string; created: boolean }[] }>;

function setup(accounts: Account[]) {
  accounts.forEach(account => setWalletApiIdForAccountId(account.id));
  const view = renderHook(() => usePerpsHandlers(accounts), {
    initialState: { accounts },
    minimal: false,
  });
  const migrateAccount = view.result.current["custom.perps.migrateAccount"] as MigrateAccount;
  const request = migrateAccount({
    params: { legacyAccountId: getWalletApiIdFromAccountId(legacyAccount.id) },
  });
  // Tests await it themselves; this only keeps a failing test from crashing the worker.
  request.catch(() => {});
  return { ...view, request };
}

/** Renders the add account drawer the hook opened. */
function renderAddAccountDrawer(store: ReturnType<typeof setup>["store"]) {
  const [Component, props] = jest.mocked(setDrawer).mock.calls.at(-1) ?? [];
  if (!Component) throw new Error("Add account did not open a drawer");
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

  it("hands the Hyperliquid account at the legacy address over without opening Add account", async () => {
    const { request } = setup([legacyAccount, otherAccount, matchingAccount]);

    await expect(request).resolves.toEqual({
      accounts: [{ accountId: getWalletApiIdFromAccountId(matchingAccount.id), created: false }],
    });
    expect(setDrawer).not.toHaveBeenCalled();
  });

  it("hands the account added at the legacy address over as created", async () => {
    const { request, store } = setup([legacyAccount, otherAccount]);
    const { user } = renderAddAccountDrawer(store);

    // The scan preselects the discovered account, as in any add account flow.
    await scan([matchingAccount]);
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await user.click(await screen.findByRole("button", { name: "Continue" }));

    await expect(request).resolves.toEqual({
      accounts: [{ accountId: getWalletApiIdFromAccountId(matchingAccount.id), created: true }],
    });
    expect(store.getState().accounts.map((a: Account) => a.id)).toContain(matchingAccount.id);
  });

  it("fails when the added account is at another address", async () => {
    const { request, store } = setup([legacyAccount]);
    const { user } = renderAddAccountDrawer(store);

    await scan([otherAccount]);
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await user.click(await screen.findByRole("button", { name: "Continue" }));

    await expect(request).rejects.toMatchObject({
      errorData: { data: { message: expect.stringContaining("legacy Perps account address") } },
    });
  });

  it("cancels when the user leaves Add account without an account", async () => {
    const { request } = setup([legacyAccount]);
    // Closes the add account drawer the hook opened, as its X does.
    await act(async () => {});
    expect(setDrawer).toHaveBeenCalled();

    act(() => setDrawer());

    await expect(request).rejects.toBeInstanceOf(UserRefusedOnDevice);
  });
});
