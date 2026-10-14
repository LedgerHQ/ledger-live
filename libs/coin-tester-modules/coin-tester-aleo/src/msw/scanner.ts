import sodium from "libsodium-wrappers";
import { randomUUID } from "node:crypto";
import type { AleoPrivateRecord, AleoRecordScannerStatusResponse } from "@ledgerhq/coin-aleo/types";
import { getLatestHeight } from "../devnode";
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
  status: () => Promise<AleoRecordScannerStatusResponse>;
  ownedRecords: (uuid: string, filter?: { unspent?: boolean }) => Promise<AleoPrivateRecord[]>;
};

/** Accounts are declared via `registerAccount`; `register` binds a session uuid to one of them. */
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
    // Envelope: 32-byte LE view key, then a 4-byte LE start height.
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

  // coin-aleo caps listings at `synced_up_to`; ownedRecords always rescans to the tip.
  async function status(): Promise<AleoRecordScannerStatusResponse> {
    return {
      synced: true,
      percentage: 100,
      sync_start_height: 0,
      synced_up_to: await getLatestHeight(),
    };
  }

  async function ownedRecords(
    uuid: string,
    filter: { unspent?: boolean } = {},
  ): Promise<AleoPrivateRecord[]> {
    const store = storesByUuid.get(uuid);
    if (!store) {
      throw new Error(
        `aleo coin-tester: fake scanner has no account registered under uuid ${uuid}`,
      );
    }

    await store.refresh();
    return store.list(filter);
  }

  return { setup, registerAccount, pubkey, register, status, ownedRecords };
}
