import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { STORAGE_FILE, decodeStorage, encodeStorage, stringValue } from "../measure/storage.ts";
import {
  MANIFEST_FILE,
  accountsByCurrency,
  readSnapshot,
  withoutInstallState,
  writeSnapshot,
} from "./files.ts";

const BTC = "accounts.active.js:2:bitcoin:xpub6C:native_segwit";
const ETH = "accounts.active.js:2:ethereum:0x71C7:";
const ETH_2 = "accounts.active.js:2:ethereum:0x71C8:";

function stored(entries: Array<[string, string | Buffer]>): Map<string, Buffer> {
  const { data, meta } = encodeStorage(entries);
  return decodeStorage(data, meta);
}

const asText = (entries: Array<[string, string | Buffer]>) =>
  entries.map(([key, value]) => [key, typeof value === "string" ? value : stringValue(value)]);

test("drops the device and the trustchain of the install, and keeps the rest as saved", () => {
  const entries = withoutInstallState(
    stored([
      ["migration-status", "completed"],
      ["settings", JSON.stringify({ lastConnectedDevice: { deviceId: "speculos" }, locale: "en" })],
      ["ble", JSON.stringify({ knownDevices: [{ id: "speculos" }] })],
      ["knownDevices", JSON.stringify({ devices: [] })],
      ["trustchain", JSON.stringify({ memberCredentials: { pubkey: "02ab" } })],
      [BTC, JSON.stringify({ data: { id: "btc" }, version: 1 })],
    ]),
  );
  assert.deepEqual(asText(entries), [
    ["migration-status", "completed"],
    ["settings", JSON.stringify({ locale: "en" })],
    [BTC, JSON.stringify({ data: { id: "btc" }, version: 1 })],
  ]);
});

test("keeps a number the app stored byte for byte, such as the last known balance", () => {
  const balance = Buffer.alloc(8);
  balance.writeDoubleLE(273.73);
  const [[key, value]] = withoutInstallState(stored([["portfolioLastKnownBalance_USD", balance]]));
  assert.equal(key, "portfolioLastKnownBalance_USD");
  assert.ok(Buffer.isBuffer(value) && value.equals(balance));
});

test("refuses settings that are not one string, as it must edit them", () => {
  assert.throws(
    () => withoutInstallState(new Map([["settings", Buffer.from([0x01])]])),
    /the settings are not a string/,
  );
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
    const balance = Buffer.alloc(8);
    balance.writeDoubleLE(273.73);
    await writeSnapshot(dir, {
      entries: [
        ["settings", "{}"],
        [BTC, '{"data":{"id":"btc"},"version":1}'],
        ["portfolioLastKnownBalance_USD", balance],
      ],
      manifest,
    });
    assert.deepEqual(JSON.parse(await readFile(path.join(dir, MANIFEST_FILE), "utf8")), manifest);
    assert.equal((await readFile(path.join(dir, STORAGE_FILE))).length % 16_384, 0);
    const read = await readSnapshot(dir);
    assert.deepEqual(read.manifest, manifest);
    assert.deepEqual(asText(read.entries.slice(0, 2)), [
      ["settings", "{}"],
      [BTC, '{"data":{"id":"btc"},"version":1}'],
    ]);
    assert.deepEqual(read.entries[2], ["portfolioLastKnownBalance_USD", balance]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
