import sodium from "libsodium-wrappers";
import { randomUUID } from "node:crypto";
import type { AleoPrivateRecord } from "@ledgerhq/coin-aleo/types";
import { loadAleoWasm } from "../wasm";
import { createRecordStore, type RecordStore } from "./records";

const KEY_ID = "coin-tester";

type KeyPair = { publicKey: Uint8Array; privateKey: Uint8Array; keyType: string };

type RegisteredAccount = {
  viewKey: string;
  store: RecordStore;
};

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((byte, index) => byte === b[index]);
}

export type FakeScanner = {
  setup: () => Promise<void>;
  registerAccount: (account: { viewKey: string; address: string }) => void;
  pubkey: () => { public_key: string; key_id: string };
  register: (encryptedBase64: string) => Promise<{ uuid: string }>;
  status: () => { synced: boolean; percentage: number };
  ownedRecords: (uuid: string, filter?: { unspent?: boolean }) => Promise<AleoPrivateRecord[]>;
};

/**
 * Stand-in for a production record scanner service.
 *
 * Real accounts are declared up front through `registerAccount`, mirroring a
 * scanner that already knows the accounts it watches. `register` only plays
 * the role a real scanner plays when a device hands it a fresh registration
 * envelope: open it and bind the resulting session `uuid` to whichever
 * registered account the envelope's view key belongs to.
 */
export function createFakeScanner(): FakeScanner {
  let keyPair: KeyPair;
  const accounts: RegisteredAccount[] = [];
  const storesByUuid = new Map<string, RecordStore>();

  async function setup(): Promise<void> {
    await sodium.ready;
    keyPair = sodium.crypto_box_keypair();
  }

  function registerAccount({ viewKey, address }: { viewKey: string; address: string }): void {
    accounts.push({ viewKey, store: createRecordStore({ viewKey, address }) });
  }

  function pubkey(): { public_key: string; key_id: string } {
    return { public_key: Buffer.from(keyPair.publicKey).toString("base64"), key_id: KEY_ID };
  }

  async function register(encryptedBase64: string): Promise<{ uuid: string }> {
    const opened = sodium.crypto_box_seal_open(
      Buffer.from(encryptedBase64, "base64"),
      keyPair.publicKey,
      keyPair.privateKey,
    );
    // The envelope is a view key (32 bytes LE) followed by a 4-byte LE start
    // height; only the view key half identifies the account.
    const viewKeyBytes = opened.slice(0, 32);

    const wasm = await loadAleoWasm();
    const account = accounts.find(candidate =>
      bytesEqual(wasm.ViewKey.from_string(candidate.viewKey).toBytesLe(), viewKeyBytes),
    );
    if (!account) {
      throw new Error(
        "aleo coin-tester: fake scanner could not match the registration envelope to a registered account",
      );
    }

    const uuid = randomUUID();
    storesByUuid.set(uuid, account.store);
    return { uuid };
  }

  function status(): { synced: boolean; percentage: number } {
    return { synced: true, percentage: 100 };
  }

  async function ownedRecords(
    uuid: string,
    filter: { unspent?: boolean } = {},
  ): Promise<AleoPrivateRecord[]> {
    const store = storesByUuid.get(uuid);
    if (!store) {
      // An unregistered uuid must fail loudly: an empty list here would look
      // exactly like an account with no records and mask a binding bug.
      throw new Error(
        `aleo coin-tester: fake scanner has no account registered under uuid ${uuid}`,
      );
    }

    await store.refresh();
    return store.list(filter);
  }

  return { setup, registerAccount, pubkey, register, status, ownedRecords };
}
