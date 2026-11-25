import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const cli = path.join(here, "..", "bin", "index.js");
const fixture = path.join(here, "fixtures", "app.json");
const workDirectory = mkdtempSync(path.join(tmpdir(), "cli-appjson-"));

const runCli = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: "utf-8" });
const readJson = filePath => JSON.parse(readFileSync(filePath, "utf-8"));
const storedAccounts = filePath => readJson(filePath).data.accounts;

function fixtureCopy(name, change = data => data) {
  const filePath = path.join(workDirectory, name);
  writeFileSync(filePath, JSON.stringify(change(readJson(fixture))));
  return filePath;
}

test("liveData prints the accounts of an app.json file in the stored order, at version 1", () => {
  const result = runCli("liveData", "--appjsonFile", fixture);

  assert.equal(result.status, 0, result.stderr);
  const printed = JSON.parse(result.stdout).data.accounts;
  assert.deepEqual(
    printed.map(entry => entry.data.id),
    storedAccounts(fixture).map(entry => entry.data.id),
  );
  assert.deepEqual(
    printed.map(entry => entry.version),
    printed.map(() => 1),
  );
});

test("liveData --add keeps the stored accounts and the other keys as they are", () => {
  const target = fixtureCopy("target.json", file => {
    file.data.accounts = file.data.accounts.slice(0, 1);
    return file;
  });
  const before = readJson(target);

  const result = runCli("liveData", "--appjsonFile", fixture, "--appjson", target, "--add");

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /1 accounts added\./);
  const after = readJson(target);
  assert.deepEqual(after.data.settings, before.data.settings);
  assert.equal(JSON.stringify(after.data.accounts[0]), JSON.stringify(before.data.accounts[0]));
  assert.equal(after.data.accounts.length, 2);
  assert.equal(after.data.accounts[1].version, 1);
  assert.ok(after.data.cryptoAssets !== undefined);
});

test("liveData --add leaves app.json as it is when it cannot write", () => {
  const target = fixtureCopy("unwritable.json", file => {
    file.data.accounts = file.data.accounts.slice(0, 1);
    return file;
  });
  const before = readFileSync(target, "utf-8");
  mkdirSync(`${target}.tmp`);

  const result = runCli("liveData", "--appjsonFile", fixture, "--appjson", target, "--add");

  assert.notEqual(result.status, 0);
  assert.equal(readFileSync(target, "utf-8"), before);
});

/** The token cache comes from the network at each run, as before: compare the rest. */
const withoutTokenCache = filePath => {
  const { cryptoAssets: _tokens, ...rest } = readJson(filePath).data;
  return JSON.stringify(rest);
};

test("liveData --add a second time adds nothing and keeps the same bytes", () => {
  const target = path.join(workDirectory, "twice.json");
  copyFileSync(fixture, target);
  runCli("liveData", "--appjsonFile", fixture, "--appjson", target, "--add");
  const once = withoutTokenCache(target);

  const result = runCli("liveData", "--appjsonFile", fixture, "--appjson", target, "--add");

  assert.match(result.stdout, /0 accounts added\./);
  assert.equal(withoutTokenCache(target), once);
});

test("an encrypted app.json file gives the same error as before", () => {
  const encrypted = fixtureCopy("encrypted.json", file => {
    file.data.accounts = "ciphertext";
    return file;
  });

  const result = runCli("liveData", "--appjsonFile", encrypted);

  assert.equal(result.status, 1);
  assert.equal(
    result.stderr.trim().split("\n").at(-1),
    "encrypted ledger live data is not supported",
  );
});

test("a bad account is a warning with its index only, and the other accounts load", () => {
  const secret = "do-not-print-this";
  const withBadAccount = fixtureCopy("bad.json", file => {
    file.data.accounts.splice(1, 0, { data: { id: secret }, version: 1 });
    return file;
  });

  const result = runCli("liveData", "--appjsonFile", withBadAccount);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /skipped the account at index 1/);
  assert.ok(!result.stderr.includes(secret));
  assert.equal(JSON.parse(result.stdout).data.accounts.length, 2);
});

test("an account with a legacy version above the line is a warning, and liveData --add keeps it as it is", () => {
  const newer = fixtureCopy("above-the-line.json", file => {
    file.data.accounts[1].version = 4;
    return file;
  });
  const [, newerAccount] = storedAccounts(newer);

  const scan = runCli("liveData", "--appjsonFile", newer);
  const add = runCli("liveData", "--appjsonFile", fixture, "--appjson", newer, "--add");

  assert.equal(scan.status, 0, scan.stderr);
  assert.match(scan.stderr, /skipped the account at index 1/);
  assert.equal(add.status, 0, add.stderr);
  assert.match(add.stdout, /0 accounts added/);
  assert.deepEqual(storedAccounts(newer)[1], newerAccount);
});

test("an account from a newer version is a warning, and liveData --add keeps it as it is", () => {
  const newer = fixtureCopy("newer.json", file => {
    file.data.accounts[1] = { $v: 1, data: file.data.accounts[1] };
    return file;
  });
  const before = JSON.stringify(storedAccounts(newer)[1]);

  const scan = runCli("liveData", "--appjsonFile", newer);
  const add = runCli("liveData", "--appjsonFile", fixture, "--appjson", newer, "--add");

  assert.equal(scan.status, 0, scan.stderr);
  assert.match(scan.stderr, /skipped the account at index 1 \(NewerRecordVersionError\)/);
  assert.equal(add.status, 0, add.stderr);
  assert.match(add.stdout, /0 accounts added/);
  assert.equal(JSON.stringify(storedAccounts(newer)[1]), before);
});

test("liveData --add does not add again an account whose stored entry is unreadable", () => {
  const target = fixtureCopy("unreadable.json", file => {
    const [first] = file.data.accounts;
    file.data.accounts = [{ data: { id: first.data.id }, version: 1 }];
    return file;
  });

  const result = runCli("liveData", "--appjsonFile", fixture, "--appjson", target, "--add");

  assert.equal(result.status, 0, result.stderr);
  const ids = storedAccounts(target).map(entry => entry.data.id);
  assert.equal(new Set(ids).size, ids.length);
});

const withUnsupportedAccount = file => {
  file.data.accounts[1].data.derivationMode = "notADerivationMode";
  return file;
};

test("liveData --add skips a stored account that the cli cannot encode", () => {
  const target = fixtureCopy("unsupported-stored.json", withUnsupportedAccount);
  const before = JSON.stringify(storedAccounts(target));

  const result = runCli("liveData", "--appjsonFile", target, "--appjson", target, "--add");

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /0 accounts added\./);
  assert.equal(JSON.stringify(storedAccounts(target)), before);
});

test("liveData --add fails on a new account that the cli cannot encode, and leaves app.json as it is", () => {
  const source = fixtureCopy("unsupported-source.json", withUnsupportedAccount);
  const target = fixtureCopy("unsupported-new.json", file => {
    file.data.accounts = file.data.accounts.slice(0, 1);
    return file;
  });
  const before = readFileSync(target, "utf-8");

  const result = runCli("liveData", "--appjsonFile", source, "--appjson", target, "--add");

  assert.notEqual(result.status, 0);
  assert.equal(readFileSync(target, "utf-8"), before);
});

test("the published manifest lists no workspace package", () => {
  const manifest = readJson(path.join(here, "..", "dist", "package.json"));
  const workspaceDependencies = Object.entries(manifest.dependencies ?? {}).filter(([name]) =>
    /^@(shared|domain|features)\//.test(name),
  );
  assert.deepEqual(workspaceDependencies, []);
});
