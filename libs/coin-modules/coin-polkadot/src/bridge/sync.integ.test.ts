import { isAccountBalanceUnconfirmed } from "@ledgerhq/ledger-wallet-framework/account";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { fromAccountRaw, toAccountRaw } from "@ledgerhq/ledger-wallet-framework/serialization";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { Account, ScanAccountEvent } from "@ledgerhq/types-live";
import { encodeAddress, randomAsU8a } from "@polkadot/util-crypto";
import { firstValueFrom, lastValueFrom, reduce, toArray } from "rxjs";
import { polkadotDefaults } from "../config";
import { createMockPolkadotContext } from "../test/config.fixture";
import type { PolkadotAccount, PolkadotSigner } from "../types";
import { createBridges } from "./index";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "./serialization";

const toFamilyRaw = { assignToAccountRaw, toOperationExtraRaw };
const fromFamilyRaw = { assignFromAccountRaw, fromOperationExtraRaw };

const SEED_PATH = "44'/354'/0'";
const USED_ADDRESS = "12YA86tRQhHgwU3SSj56aesUKB7GKvdnZTTTXRop4vd3YgDV";
const SEED_PUBLIC_KEY = "3a521fa830998568da9c205c987dcd157a78b2bd30ece3d1b6c32213986864ca";
const UNUSED_ADDRESS = encodeAddress(randomAsU8a(32), 0);
const SYNC_CONFIG = { paginationConfig: {}, blacklistedTokenIds: [] };

const addresses: Record<string, string> = {
  [SEED_PATH]: USED_ADDRESS,
  "44'/354'/0'/0'/0'": USED_ADDRESS,
  "44'/354'/1'/0'/0'": UNUSED_ADDRESS,
};

const isDiscovered = (
  event: ScanAccountEvent,
): event is Extract<ScanAccountEvent, { type: "discovered" }> => event.type === "discovered";

const isPolkadotAccount = (account: Account): account is PolkadotAccount =>
  account.currency.family === "polkadot";

const signer: PolkadotSigner = {
  getAddress: async (path: string) => {
    const address = addresses[path];
    if (!address) throw new Error(`unexpected derivation path ${path}`);
    return { address, pubKey: SEED_PUBLIC_KEY, return_code: 0x9000 };
  },
  sign: async () => ({ signature: null, return_code: 0x9000 }),
};
const signerContext: SignerContext<PolkadotSigner> = (_deviceId, fn) => fn(signer);
const { currencyBridge, accountBridge } = createBridges(
  signerContext,
  createMockPolkadotContext(polkadotDefaults.assethub_polkadot),
);

const sync = (account: PolkadotAccount): Promise<PolkadotAccount> =>
  firstValueFrom(
    accountBridge
      .sync(account, SYNC_CONFIG)
      .pipe(reduce((current, update) => update(current), account)),
  );

describe("Polkadot account bridge sync (integration)", () => {
  let scanned: PolkadotAccount;
  let synced: PolkadotAccount;

  beforeAll(async () => {
    const events = await lastValueFrom(
      currencyBridge
        .scanAccounts({
          currency: getCryptoCurrencyById("assethub_polkadot"),
          deviceId: "device",
          syncConfig: SYNC_CONFIG,
        })
        .pipe(toArray()),
    );
    [scanned] = events
      .filter(isDiscovered)
      .map(event => event.account)
      .filter(isPolkadotAccount);
    synced = await sync({
      ...scanned,
      operations: [],
      operationsCount: 0,
      pendingOperations: [],
      blockHeight: 0,
    });
  }, 240_000);

  it("restores the identity and the operations of the scanned account", () => {
    expect({
      id: synced.id,
      freshAddress: synced.freshAddress,
      operationIds: synced.operations.map(operation => operation.id),
    }).toEqual({
      id: scanned.id,
      freshAddress: scanned.freshAddress,
      operationIds: expect.arrayContaining(scanned.operations.map(operation => operation.id)),
    });
  });

  it("serializes the synced account to a raw that survives a round trip", async () => {
    const raw = toAccountRaw(synced, toFamilyRaw);

    const restored = await fromAccountRaw(raw, fromFamilyRaw);

    expect(toAccountRaw(restored, toFamilyRaw)).toEqual(raw);
  });

  it("has no NaN balance, operation value or operation fee", () => {
    expect({
      balance: synced.balance.isNaN(),
      values: synced.operations.filter(operation => operation.value.isNaN()),
      fees: synced.operations.filter(operation => operation.fee.isNaN()),
    }).toEqual({ balance: false, values: [], fees: [] });
  });

  it("has a positive balance and a spendable balance between zero and the balance", () => {
    expect([
      synced.balance.gt(0),
      synced.spendableBalance.gte(0),
      synced.spendableBalance.lte(synced.balance),
    ]).toEqual([true, true, true]);
  });

  it("has no unconfirmed balance", () => {
    expect(isAccountBalanceUnconfirmed(synced)).toBe(false);
  });

  it("has a creation date that is not after its oldest operation", () => {
    const oldest = synced.operations[synced.operations.length - 1];

    expect(synced.creationDate.getTime()).toBeLessThanOrEqual(oldest.date.getTime());
  });

  it("has no operation with a duplicated id", () => {
    const ids = synced.operations.map(operation => operation.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
