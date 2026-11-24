import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import type { Account } from "./enum/Account";
import { seedZcashPrivateInfo } from "./cliCommandsUtils";
import { applyGeneratedUserdata } from "./generatedUserdata";
import { addRawAccountIfMissing } from "./userdataAccounts";

const directory = mkdtempSync(path.join(os.tmpdir(), "e2e-userdata-"));
let fileIndex = 0;

const STORED_BITCOIN = {
  data: { id: "js:2:bitcoin:xpub1:native_segwit", currencyId: "bitcoin", index: 0, name: "BTC 1" },
  version: 3,
};

function userdataFile(content: unknown): string {
  const filePath = path.join(directory, `app-${fileIndex++}.json`);
  writeFileSync(filePath, typeof content === "string" ? content : JSON.stringify(content));
  return filePath;
}

const baseUserdata = () => ({
  data: { settings: { counterValue: "USD" }, accounts: [STORED_BITCOIN] },
  other: true,
});

/** What the e2e seeds wrote before the move to the accounts record. */
function legacyAppend(filePath: string, raw: Record<string, unknown>) {
  const file = JSON.parse(readFileSync(filePath, "utf-8"));
  file.data.accounts.push({ data: raw, version: 1 });
  return JSON.stringify(file);
}

const fakeAccount = (currencyId: string, index: number) =>
  ({ currency: { id: currencyId }, index }) as unknown as Account;

test("addRawAccountIfMissing writes the same bytes as the legacy seed", async () => {
  const filePath = userdataFile(baseUserdata());
  const raw = { id: "js:2:tron:T1:", seedIdentifier: "x", currencyId: "tron", balance: "0" };
  const expected = legacyAppend(filePath, raw);

  await addRawAccountIfMissing(filePath, raw);

  assert.equal(readFileSync(filePath, "utf-8"), expected);
});

test("addRawAccountIfMissing does not write when the account is there", async () => {
  const filePath = userdataFile(baseUserdata());
  const before = readFileSync(filePath, "utf-8");

  await addRawAccountIfMissing(filePath, { id: STORED_BITCOIN.data.id, currencyId: "bitcoin" });

  assert.equal(readFileSync(filePath, "utf-8"), before);
});

test("addRawAccountIfMissing refuses an encrypted file with the legacy message", async () => {
  const filePath = userdataFile({ data: { accounts: "ciphertext" } });
  await assert.rejects(addRawAccountIfMissing(filePath, { id: "a", currencyId: "tron" }), {
    message: "encrypted ledger live data is not supported",
  });
});

const OBJECT_ACCOUNTS = { data: { accounts: { a: STORED_BITCOIN } } };

test("addRawAccountIfMissing refuses accounts that are not a list, and keeps them", async () => {
  const filePath = userdataFile(OBJECT_ACCOUNTS);
  const before = readFileSync(filePath, "utf-8");
  await assert.rejects(addRawAccountIfMissing(filePath, { id: "a", currencyId: "tron" }), {
    name: "TypeError",
  });
  assert.equal(readFileSync(filePath, "utf-8"), before);
});

test("addRawAccountIfMissing needs the file to exist, as before", async () => {
  await assert.rejects(
    addRawAccountIfMissing(path.join(directory, "missing.json"), { id: "a", currencyId: "tron" }),
    { code: "ENOENT" },
  );
});

test("seedZcashPrivateInfo adds the private info to the matching account only", async () => {
  const zcash = { data: { id: "js:2:zcash:t1:", currencyId: "zcash", index: 1 }, version: 1 };
  const filePath = userdataFile({ data: { accounts: [STORED_BITCOIN, zcash] } });

  await seedZcashPrivateInfo(fakeAccount("zcash", 1), "zs1shielded")(filePath);

  const [bitcoin, seeded] = JSON.parse(readFileSync(filePath, "utf-8")).data.accounts;
  assert.deepEqual(bitcoin, STORED_BITCOIN);
  assert.equal(seeded.data.privateInfo.shieldedAddress, "zs1shielded");
  assert.deepEqual(Object.keys(seeded.data), ["id", "currencyId", "index", "privateInfo"]);
});

test("seedZcashPrivateInfo keeps an unreadable entry as it is", async () => {
  const unreadable = {
    data: { id: "js:2:zcash:t0:", currencyId: "zcash", index: 1, secret: "s" },
    version: 9,
  };
  const zcash = { data: { id: "js:2:zcash:t1:", currencyId: "zcash", index: 1 }, version: 1 };
  const filePath = userdataFile({ data: { accounts: [unreadable, zcash] } });

  await seedZcashPrivateInfo(fakeAccount("zcash", 1), "zs1shielded")(filePath);

  const [kept, seeded] = JSON.parse(readFileSync(filePath, "utf-8")).data.accounts;
  assert.deepEqual(kept, unreadable);
  assert.equal(seeded.data.privateInfo.shieldedAddress, "zs1shielded");
});

test("seedZcashPrivateInfo refuses an encrypted file", async () => {
  const filePath = userdataFile({ data: { accounts: "ciphertext" } });
  await assert.rejects(seedZcashPrivateInfo(fakeAccount("zcash", 1), "zs1")(filePath), TypeError);
});

test("applyGeneratedUserdata appends the generated account and merges its tokens", async () => {
  const generatedDirectory = mkdtempSync(path.join(os.tmpdir(), "e2e-generated-"));
  const generated = {
    data: { id: "js:2:ethereum:0xabc:", currencyId: "ethereum", index: 0 },
    version: 1,
  };
  writeFileSync(
    path.join(generatedDirectory, "ethereum.json"),
    JSON.stringify({
      data: { accounts: [generated], cryptoAssets: { version: 2, tokens: [{ id: "usdc" }] } },
    }),
  );
  const filePath = userdataFile(baseUserdata());
  process.env.E2E_GENERATED_USERDATA_DIR = generatedDirectory;

  try {
    assert.equal(await applyGeneratedUserdata(fakeAccount("ethereum", 0), filePath), true);
    assert.equal(await applyGeneratedUserdata(fakeAccount("ethereum", 0), filePath), true);
  } finally {
    delete process.env.E2E_GENERATED_USERDATA_DIR;
  }

  const file = JSON.parse(readFileSync(filePath, "utf-8"));
  assert.deepEqual(file.data.accounts, [STORED_BITCOIN, generated]);
  assert.deepEqual(file.data.cryptoAssets, { version: 2, tokens: [{ id: "usdc" }] });
  assert.equal(file.other, true);
});

test("applyGeneratedUserdata leaves an encrypted file to the cli", async () => {
  const generatedDirectory = mkdtempSync(path.join(os.tmpdir(), "e2e-generated-"));
  writeFileSync(
    path.join(generatedDirectory, "ethereum.json"),
    JSON.stringify({
      data: { accounts: [{ data: { id: "e", currencyId: "ethereum", index: 0 }, version: 1 }] },
    }),
  );
  const filePath = userdataFile({ data: { accounts: "ciphertext" } });
  const before = readFileSync(filePath, "utf-8");
  process.env.E2E_GENERATED_USERDATA_DIR = generatedDirectory;

  try {
    assert.equal(await applyGeneratedUserdata(fakeAccount("ethereum", 0), filePath), false);
  } finally {
    delete process.env.E2E_GENERATED_USERDATA_DIR;
  }

  assert.equal(readFileSync(filePath, "utf-8"), before);
});

test("applyGeneratedUserdata refuses accounts that are not a list, and keeps them", async () => {
  const generatedDirectory = mkdtempSync(path.join(os.tmpdir(), "e2e-generated-"));
  writeFileSync(
    path.join(generatedDirectory, "ethereum.json"),
    JSON.stringify({
      data: { accounts: [{ data: { id: "e", currencyId: "ethereum", index: 0 }, version: 1 }] },
    }),
  );
  const filePath = userdataFile(OBJECT_ACCOUNTS);
  const before = readFileSync(filePath, "utf-8");
  process.env.E2E_GENERATED_USERDATA_DIR = generatedDirectory;

  try {
    await assert.rejects(applyGeneratedUserdata(fakeAccount("ethereum", 0), filePath), {
      name: "TypeError",
    });
  } finally {
    delete process.env.E2E_GENERATED_USERDATA_DIR;
  }

  assert.equal(readFileSync(filePath, "utf-8"), before);
});
