import { from, lastValueFrom, toArray } from "rxjs";
import { configureStore } from "@reduxjs/toolkit";
import {
  AccountIdSchema,
  accountsSlice,
  discoveredAccountsSlice,
  legacyAccountsSynced,
  type AccountUUID,
  type LegacyAccountEntry,
} from "@domain/entity-account";
import { computeAccountUUID, mockAccountEntry } from "@domain/entity-account/schema.mock";
import {
  mockAddressAccountDescriptor,
  mockUtxoAccountDescriptor,
} from "@domain/entity-account-descriptor/schema.mock";
import { candidateOf } from "@domain/entity-derivation";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { DiscoveredAccount } from "./discoverAccounts";
import { registerDiscoveredAccounts } from "./registerDiscoveredAccounts";

const bitcoin = findCryptoCurrencyById("bitcoin");
if (!bitcoin) throw new Error("bitcoin is in the currency list");

const found: DiscoveredAccount[] = [
  {
    descriptor: mockUtxoAccountDescriptor(),
    candidate: candidateOf(bitcoin, "native_segwit", 0),
    status: { used: true, gate: null },
  },
  {
    descriptor: mockAddressAccountDescriptor(),
    candidate: candidateOf(bitcoin, "native_segwit", 1),
    status: { used: false, gate: null },
  },
];

const storeOf = () =>
  configureStore({
    reducer: {
      accountEntries: accountsSlice.reducer,
      discoveredAccounts: discoveredAccountsSlice.reducer,
    },
  });

const isHeldOf = (store: ReturnType<typeof storeOf>) => (accountUUID: AccountUUID) =>
  accountsSlice.getSelectors().selectAccountEntry(store.getState().accountEntries, accountUUID) !==
  undefined;

describe("registerDiscoveredAccounts", () => {
  it("registers each descriptor and hands its AccountUUID instead", async () => {
    const store = storeOf();
    const scanned = await lastValueFrom(
      from(found).pipe(registerDiscoveredAccounts(store.dispatch, isHeldOf(store)), toArray()),
    );
    const uuids = found.map(({ descriptor }) => computeAccountUUID(descriptor));
    expect(scanned).toEqual(
      found.map(({ candidate, status }, i) => ({ accountUUID: uuids[i], candidate, status })),
    );
    expect(scanned.some(account => "descriptor" in account)).toBe(false);
    expect(store.getState().discoveredAccounts).toEqual({
      [uuids[0]]: found[0].descriptor,
      [uuids[1]]: found[1].descriptor,
    });
  });

  it("skips registration for a UUID the accounts slice already holds after promotion", async () => {
    const store = storeOf();
    const saved: LegacyAccountEntry = {
      ...mockAccountEntry({ descriptor: found[0].descriptor }),
      legacyId: AccountIdSchema.parse("js:2:bitcoin:xpubSaved:"),
    };
    const heldUuid = saved.accountUUID;
    const otherUuid = computeAccountUUID(found[1].descriptor);

    await lastValueFrom(
      from(found).pipe(registerDiscoveredAccounts(store.dispatch, isHeldOf(store)), toArray()),
    );
    expect(store.getState().discoveredAccounts[heldUuid]).toEqual(found[0].descriptor);

    store.dispatch(legacyAccountsSynced([saved]));
    expect(store.getState().discoveredAccounts[heldUuid]).toBeUndefined();

    await lastValueFrom(
      from(found).pipe(registerDiscoveredAccounts(store.dispatch, isHeldOf(store)), toArray()),
    );
    expect(store.getState().discoveredAccounts[heldUuid]).toBeUndefined();
    expect(store.getState().discoveredAccounts[otherUuid]).toEqual(found[1].descriptor);

    store.dispatch(legacyAccountsSynced([]));
    expect(store.getState().discoveredAccounts[heldUuid]).toBeUndefined();
    expect(
      accountsSlice.getSelectors().selectAccountEntry(store.getState().accountEntries, heldUuid),
    ).toBeUndefined();
  });
});
