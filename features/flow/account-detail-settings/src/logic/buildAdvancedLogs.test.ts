import { buildAdvancedLogs, type AdvancedLogsInput } from "./buildAdvancedLogs";

const lastSyncDate = new Date(2026, 3, 2, 17, 43);

const utxoInput: AdvancedLogsInput = {
  xpub: "xpub6CfS3Rvxvg397AgEpkVThqhyCyjXF9abJFqh6MPxrYvki7cvy3odrbgt83LT9zn8fc",
  index: 0,
  freshAddressPath: "84'/0'/0'/0/1",
  id: "js:2:bitcoin:xpub6CfS3Rvxvg397AgEpkVThqhyCyjXF9abJFqh6MPxrYvki7cvy3odrbgt83LT9zn8fc:native_segwit",
  blockHeight: 943376,
  lastSyncDate,
};

describe("buildAdvancedLogs", () => {
  it("keeps only the logged fields, in order", () => {
    const { json } = buildAdvancedLogs(utxoInput, "en-US");

    expect(JSON.parse(json)).toEqual({
      xpub: utxoInput.xpub,
      index: 0,
      freshAddressPath: "84'/0'/0'/0/1",
      id: utxoInput.id,
      blockHeight: 943376,
    });
    expect(Object.keys(JSON.parse(json))).toEqual([
      "xpub",
      "index",
      "freshAddressPath",
      "id",
      "blockHeight",
    ]);
  });

  it("pretty prints the logs with two spaces", () => {
    const { json } = buildAdvancedLogs(utxoInput, "en-US");

    expect(json.split("\n")[1]).toBe(`  "xpub": "${utxoInput.xpub}",`);
  });

  it("leaves the xpub out for account-based chains", () => {
    const { json } = buildAdvancedLogs({ ...utxoInput, xpub: undefined }, "en-US");

    expect(JSON.parse(json)).not.toHaveProperty("xpub");
  });

  it("formats the sync date in the given locale", () => {
    const expected = new Intl.DateTimeFormat("en-US", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(lastSyncDate);

    expect(buildAdvancedLogs(utxoInput, "en-US").syncDate).toBe(expected);
    expect(buildAdvancedLogs(utxoInput, "en-US").syncDate).toContain("April 2, 2026");
  });
});
