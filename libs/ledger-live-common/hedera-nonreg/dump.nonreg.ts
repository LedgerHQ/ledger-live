import "../src/__tests__/test-helpers/setup.integration";
import fs from "fs";
import path from "path";
import { firstValueFrom } from "rxjs";
import { reduce } from "rxjs/operators";
import { getSyncHash } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { Account, Operation } from "@ledgerhq/types-live";
import { fromAccountRaw, toAccountRaw } from "../src/account";
import { getAccountBridge } from "../src/bridge";
import { getOperationAmountNumber } from "../src/operation";

const variant = process.env.VARIANT ?? "";
const accounts = (process.env.ACCOUNTS ?? "0.0.8835924").split(",").filter(Boolean);
const outDir = path.join(__dirname, "out", variant);

function dumpOperation(op: Operation) {
  return {
    id: op.id,
    hash: op.hash,
    type: op.type,
    value: op.value.toFixed(),
    fee: op.fee.toFixed(),
    signed: getOperationAmountNumber(op).toFixed(),
    senders: op.senders,
    recipients: op.recipients,
    blockHeight: op.blockHeight,
    date: op.date.toISOString(),
    hasFailed: op.hasFailed ?? false,
    extra: op.extra,
    subOperations: (op.subOperations ?? []).map(sub => sub.id),
    internalOperations: (op.internalOperations ?? []).map(dumpOperation),
  };
}

function dumpAccount(account: Account) {
  return {
    id: account.id,
    balance: account.balance.toFixed(),
    spendableBalance: account.spendableBalance.toFixed(),
    blockHeight: account.blockHeight,
    operations: account.operations.map(dumpOperation),
    pendingOperations: account.pendingOperations.length,
    subAccounts: (account.subAccounts ?? []).map(sub => ({
      id: sub.id,
      tokenId: sub.type === "TokenAccount" ? sub.token.id : sub.type,
      balance: sub.balance.toFixed(),
      operations: sub.operations.map(dumpOperation),
    })),
    raw: toAccountRaw(account),
  };
}

describe(`hedera nonreg dump (${variant})`, () => {
  beforeAll(() => fs.mkdirSync(outDir, { recursive: true }));

  it("loads the expected Hedera sources", () => {
    const resolved = require.resolve("@ledgerhq/coin-hedera/logic/listOperations.v2");
    expect(resolved.includes(".nonreg-develop")).toBe(variant === "develop");
  });

  // `0.0.X@<unix seconds>` syncs incrementally from that time: a placeholder op one synthetic block
  // (10s) earlier makes the generic sync resume there, as it would for a stored account.
  it.each(accounts)("syncs %s", async entry => {
    const [address, since] = entry.split("@");
    const accountId = `js:2:hedera:${address}:hederaBip44`;
    const sinceBlock = since ? Math.floor(Number(since) / 10) : 0;
    const placeholder = {
      id: "nonreg-placeholder",
      hash: "nonreg-placeholder",
      type: "NONE" as const,
      value: "0",
      fee: "0",
      senders: [],
      recipients: [],
      blockHeight: sinceBlock - 1,
      blockHash: null,
      accountId,
      date: new Date((sinceBlock - 1) * 10_000).toISOString(),
      extra: {},
    };
    const account = await fromAccountRaw({
      id: accountId,
      seedIdentifier: "",
      name: address,
      derivationMode: "hederaBip44",
      index: 0,
      freshAddress: address,
      freshAddressPath: "44/3030/0/0/0",
      blockHeight: sinceBlock,
      syncHash: since ? `${await getSyncHash("hedera", [])}-1` : undefined,
      operations: since ? [placeholder] : [],
      pendingOperations: [],
      currencyId: "hedera",
      lastSyncDate: "",
      balance: "0",
    });
    const bridge = await getAccountBridge(account, null);
    const started = Date.now();
    const synced = await firstValueFrom(
      bridge
        .sync(account, { paginationConfig: {}, blacklistedTokenIds: [] })
        .pipe(reduce((acc, update: (a: Account) => Account) => update(acc), account)),
    );

    const dump = dumpAccount(synced);
    dump.operations = dump.operations.filter(op => op.hash !== placeholder.hash);
    fs.writeFileSync(
      path.join(outDir, `${address}.json`),
      JSON.stringify({ since: since ?? null, syncMs: Date.now() - started, ...dump }, null, 1),
    );
  });
});
