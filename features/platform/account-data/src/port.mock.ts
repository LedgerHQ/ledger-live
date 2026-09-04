import { AccountIdSchema } from "@shared/schema-primitives";
import {
  mockAccountBalance,
  mockTokenAccountBalance,
} from "@domain/entity-account-balance/schema.mock";
import type { AccountDataSource, AccountRef, AccountSlice, SliceUpdate } from "./port";

/** Test-only fakes for the {@link AccountDataSource} port. Not re-exported from the barrel. */

/** A distinct account id per address, so tests can exercise several accounts at once. */
export const accountIdFor = (address: string) => AccountIdSchema.parse(`js:2:ethereum:${address}:`);

export const makeRef = (overrides: Partial<AccountRef> = {}): AccountRef => ({
  accountId: AccountIdSchema.parse("js:2:ethereum:0xabc:"),
  currencyId: "ethereum",
  address: "0xabc",
  derivationMode: "",
  ...overrides,
});

export const balanceUpdate = (ref: AccountRef): SliceUpdate => ({
  slice: "balance",
  accountId: ref.accountId,
  balances: [
    mockAccountBalance({ accountId: ref.accountId }),
    mockTokenAccountBalance({ parentId: ref.accountId }),
  ],
});

export type FakeSourceOptions = {
  id: string;
  priority: number;
  capabilities?: readonly AccountSlice[];
  deliveries?: readonly AccountSlice[];
  supports?: boolean;
  /** Emitted in order; defaults to one balance update when `balance` is delivered. */
  updates?: (ref: AccountRef) => SliceUpdate[];
  fail?: Error;
  /** Resolved before the first emission, to exercise concurrency and coalescing. */
  gate?: Promise<void>;
  onFetch?: (ref: AccountRef, slices: readonly AccountSlice[]) => void;
};

export function fakeSource({
  id,
  priority,
  capabilities = [],
  deliveries = capabilities,
  supports = true,
  updates,
  fail,
  gate,
  onFetch,
}: FakeSourceOptions): AccountDataSource {
  const capabilitySet = new Set(capabilities);
  const deliverySet = new Set(deliveries);
  return {
    id,
    priority,
    supports: () => supports,
    capabilities: () => capabilitySet,
    deliveries: () => deliverySet,
    async *fetch({ ref, slices }) {
      onFetch?.(ref, slices);
      if (gate) await gate;
      if (fail) throw fail;
      const emitted = updates
        ? updates(ref)
        : deliverySet.has("balance")
          ? [balanceUpdate(ref)]
          : [];
      for (const update of emitted) yield update;
    },
  };
}
