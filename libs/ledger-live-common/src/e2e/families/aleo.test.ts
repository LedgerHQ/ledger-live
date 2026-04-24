import { encodeAccountId, decodeAccountId } from "../../account";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { patchAccountRawWithViewKey } from "./aleo";
import type { AccountRaw, OperationRaw } from "@ledgerhq/types-live";

const baseId = encodeAccountId({
  type: "js",
  version: "2",
  currencyId: "aleo",
  xpubOrAddress: "aleo1abc123",
  derivationMode: "aleo",
});

const makeOp = (accountId: string, hash: string): OperationRaw => ({
  id: encodeOperationId(accountId, hash, "OUT"),
  accountId,
  hash,
  type: "OUT",
  value: "1000",
  fee: "100",
  senders: [],
  recipients: [],
  blockHeight: 1,
  blockHash: "blockhash",
  date: new Date(0).toISOString(),
  extra: {},
});

const makeAccountRaw = (overrides?: Partial<AccountRaw>): AccountRaw =>
  ({
    id: baseId,
    currencyId: "aleo",
    freshAddress: "aleo1abc123",
    freshAddressPath: "44'/683'/0'/0'",
    name: "Aleo 1",
    balance: "100000",
    spendableBalance: "100000",
    blockHeight: 0,
    operations: [],
    pendingOperations: [],
    operationsCount: 0,
    lastSyncDate: new Date(0).toISOString(),
    creationDate: new Date(0).toISOString(),
    freshAddresses: [],
    syncHash: "",
    starred: false,
    used: false,
    unitMagnitude: 6,
    index: 0,
    derivationMode: "aleo",
    ...overrides,
  }) as AccountRaw;

describe("patchAccountRawWithViewKey", () => {
  const viewKey = "AViewKey1abcdefghijklmnop";

  it("embeds viewKey as customData in the account ID", () => {
    const patched = patchAccountRawWithViewKey(makeAccountRaw(), viewKey);
    expect(decodeAccountId(patched.id).customData).toBe(viewKey);
  });

  it("preserves all other accountId segments", () => {
    const raw = makeAccountRaw();
    const patched = patchAccountRawWithViewKey(raw, viewKey);
    const original = decodeAccountId(raw.id);
    const updated = decodeAccountId(patched.id);

    expect(updated.type).toBe(original.type);
    expect(updated.version).toBe(original.version);
    expect(updated.currencyId).toBe(original.currencyId);
    expect(updated.xpubOrAddress).toBe(original.xpubOrAddress);
    expect(updated.derivationMode).toBe(original.derivationMode);
  });

  it("updates operation IDs and accountId to use the new account ID", () => {
    const raw = makeAccountRaw({ operations: [makeOp(baseId, "txhash1")] });
    const patched = patchAccountRawWithViewKey(raw, viewKey);

    expect(patched.operations[0].accountId).toBe(patched.id);
    expect(patched.operations[0].id).toBe(encodeOperationId(patched.id, "txhash1", "OUT"));
  });

  it("updates pendingOperation IDs and accountId to use the new account ID", () => {
    const raw = makeAccountRaw({ pendingOperations: [makeOp(baseId, "pendinghash1")] });
    const patched = patchAccountRawWithViewKey(raw, viewKey);

    expect(patched.pendingOperations[0].accountId).toBe(patched.id);
    expect(patched.pendingOperations[0].id).toBe(
      encodeOperationId(patched.id, "pendinghash1", "OUT"),
    );
  });

  it("does not mutate the original AccountRaw", () => {
    const raw = makeAccountRaw({ operations: [makeOp(baseId, "txhash1")] });
    const originalId = raw.id;
    const originalOpId = raw.operations[0].id;

    patchAccountRawWithViewKey(raw, viewKey);

    expect(raw.id).toBe(originalId);
    expect(raw.operations[0].id).toBe(originalOpId);
  });

  it("handles an account with no operations", () => {
    const raw = makeAccountRaw({ operations: [], pendingOperations: [] });
    const patched = patchAccountRawWithViewKey(raw, viewKey);

    expect(patched.operations).toHaveLength(0);
    expect(patched.pendingOperations).toHaveLength(0);
    expect(decodeAccountId(patched.id).customData).toBe(viewKey);
  });
});
