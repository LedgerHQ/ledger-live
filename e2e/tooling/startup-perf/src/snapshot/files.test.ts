import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { STORAGE_FILE, decodeStorage, encodeStorage } from "../measure/storage.ts";
import {
  MANIFEST_FILE,
  accountsByCurrency,
  readSnapshot,
  withoutDevice,
  writeSnapshot,
} from "./files.ts";

const BTC = "accounts.active.js:2:bitcoin:xpub6C:native_segwit";
const ETH = "accounts.active.js:2:ethereum:0x71C7:";
const ETH_2 = "accounts.active.js:2:ethereum:0x71C8:";

function stored(entries: Array<[string, string]>): Map<string, Buffer> {
  const { data, meta } = encodeStorage(entries);
  return decodeStorage(data, meta);
}

test("drops the device the accounts were added on, and keeps the rest as saved", () => {
  const entries = withoutDevice(
    stored([
      ["migration-status", "completed"],
      ["settings", JSON.stringify({ lastConnectedDevice: { deviceId: "speculos" }, locale: "en" })],
      ["ble", JSON.stringify({ knownDevices: [{ id: "speculos" }] })],
      ["knownDevices", JSON.stringify({ devices: [] })],
      [BTC, JSON.stringify({ data: { id: "btc" }, version: 1 })],
    ]),
  );
  assert.deepEqual(entries, [
    ["migration-status", "completed"],
    ["settings", JSON.stringify({ locale: "en" })],
    [BTC, JSON.stringify({ data: { id: "btc" }, version: 1 })],
  ]);
});

test("refuses a value that is not one string, which the snapshot could not write back", () => {
  const values = new Map([["flag", Buffer.from([0x01])]]);
  assert.throws(() => withoutDevice(values), /the value of flag is not a string/);
});

test("counts the account records by currency, not the order list", () => {
  assert.deepEqual(
    accountsByCurrency([
      [BTC, "{}"],
      [ETH, "{}"],
      [ETH_2, "{}"],
      ["accounts.sort", "[]"],
      ["settings", "{}"],
    ]),
    { bitcoin: 1, ethereum: 2 },
  );
});

test("writes the storage files and the manifest, and reads them back", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "snapshot-"));
  try {
    const manifest = {
      release: "live-mobile@4.29.0",
      platform: "android",
      createdAt: "2026-11-19T00:00:00.000Z",
      accounts: { bitcoin: 1 },
    };
    const entries: Array<[string, string]> = [
      ["settings", "{}"],
      [BTC, '{"data":{"id":"btc"},"version":1}'],
    ];
    await writeSnapshot(dir, { entries, manifest });
    assert.deepEqual(JSON.parse(await readFile(path.join(dir, MANIFEST_FILE), "utf8")), manifest);
    assert.equal((await readFile(path.join(dir, STORAGE_FILE))).length % 16_384, 0);
    assert.deepEqual(await readSnapshot(dir), { entries, manifest });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
