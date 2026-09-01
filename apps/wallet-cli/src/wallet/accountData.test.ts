import { describe, expect, it, mock } from "bun:test";
import { accountRefOf, createAccountDataRuntime } from "./accountData";
import { AccountIdSchema, BigNumberStrSchema, DateTimeIsoSchema } from "@shared/schema-primitives";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import type { AccountBalance } from "@domain/entity-account-balance";
import { XPUB } from "../shared/accountDescriptor/test-fixtures";
import type { AccountDescriptor } from "./models";

const EVM_ID = "js:2:ethereum:0xabc:";
const BTC_ID = `js:2:bitcoin:${XPUB}:native_segwit`;

const evmDescriptor: AccountDescriptor = {
  id: EVM_ID,
  currencyId: "ethereum",
  freshAddress: "0xabc",
  seedIdentifier: "0xabc",
  derivationMode: "",
  index: 0,
};

const btcDescriptor: AccountDescriptor = {
  id: BTC_ID,
  currencyId: "bitcoin",
  freshAddress: "",
  seedIdentifier: XPUB,
  derivationMode: "native_segwit",
  index: 0,
};

const getBalanceRows = mock(async () => [
  {
    accountId: AccountIdSchema.parse(EVM_ID),
    assetId: CryptoCurrencyIdSchema.parse("ethereum"),
    value: "1500",
    locked: "100",
  },
  {
    accountId: AccountIdSchema.parse(`${EVM_ID}+ethereum%2Ferc20%2Fusd__coin`),
    assetId: TokenCurrencyIdSchema.parse("ethereum/erc20/usd__coin"),
    value: "42",
    parentId: AccountIdSchema.parse(EVM_ID),
  },
]);

const bridgeRow = (accountId: string, assetId: string, balance: string): AccountBalance =>
  ({
    accountId: AccountIdSchema.parse(accountId),
    assetId: CryptoCurrencyIdSchema.parse(assetId),
    balance: BigNumberStrSchema.parse(balance),
    spendableBalance: BigNumberStrSchema.parse(balance),
    at: DateTimeIsoSchema.parse("2026-01-31T12:00:00.000Z"),
  }) as AccountBalance;

const syncBalanceRows = mock(async () => [bridgeRow(BTC_ID, "bitcoin", "7")]);

// Injected, never `mock.module`: the command tests run the CLI in process, so a module mock on a
// shared module bleeds into them (see the warning in src/test/helpers/cli-runner.ts).
const adapters = {
  loadCoinFramework: async () => ({ getBalanceRows }),
  loadBridge: async () => ({ getBalanceRows: syncBalanceRows }),
};

const runtimeFor = (descriptor: AccountDescriptor) =>
  createAccountDataRuntime({
    descriptorById: id => (id === descriptor.id ? descriptor : undefined),
    adapters,
  });

const readBalance = async (descriptor: AccountDescriptor) => {
  const { scheduler, rowsOf } = runtimeFor(descriptor);
  const ref = accountRefOf(descriptor);
  await scheduler.fetch({ ref, slices: ["balance"], reason: "test", maxAge: 0 });
  return { rows: rowsOf(descriptor.id), status: scheduler.getStatus(ref.accountId, "balance") };
};

describe("accountRefOf", () => {
  it("uses the fresh address when the descriptor carries one", () => {
    expect(accountRefOf(evmDescriptor)).toEqual({
      accountId: AccountIdSchema.parse(EVM_ID),
      currencyId: "ethereum",
      address: "0xabc",
      derivationMode: "",
    });
  });

  it("falls back to the xpub encoded in the id", () => {
    expect(accountRefOf(btcDescriptor).address).toBe(XPUB);
  });
});

describe("createAccountDataRuntime", () => {
  it("reads a granular family straight from the coin module, with no full sync", async () => {
    getBalanceRows.mockClear();
    syncBalanceRows.mockClear();
    const { rows, status } = await readBalance(evmDescriptor);
    expect(getBalanceRows).toHaveBeenCalledTimes(1);
    expect(syncBalanceRows).not.toHaveBeenCalled();
    expect(status.sourceId).toBe("coin-module-api");
    expect(rows.map(row => [String(row.assetId), String(row.balance)])).toEqual([
      ["ethereum", "1500"],
      ["ethereum/erc20/usd__coin", "42"],
    ]);
  });

  it("returns native and token balances from that single call", async () => {
    const { rows } = await readBalance(evmDescriptor);
    expect(rows).toHaveLength(2);
    expect(String(rows[0].spendableBalance)).toBe("1400"); // 1500 - 100 locked
  });

  it("keeps a family the wallet routes granularly on the full sync — the narrowing is deliberate", async () => {
    getBalanceRows.mockClear();
    syncBalanceRows.mockClear();
    const xrpDescriptor: AccountDescriptor = {
      id: "js:2:ripple:rXYZ:",
      currencyId: "ripple",
      freshAddress: "rXYZ",
      seedIdentifier: "rXYZ",
      derivationMode: "",
      index: 0,
    };
    // `xrp` is enabled in the wallet's own gate, but this CLI narrows to `evm` until each family's
    // `balances` output has been compared before and after. Widening is a one-line change.
    const { status } = await readBalance(xrpDescriptor);
    expect(status.sourceId).toBe("legacy-bridge");
    expect(getBalanceRows).not.toHaveBeenCalled();
  });

  it("falls back to the full bridge sync outside the narrowed set", async () => {
    getBalanceRows.mockClear();
    syncBalanceRows.mockClear();
    const { rows, status } = await readBalance(btcDescriptor);
    expect(syncBalanceRows).toHaveBeenCalledTimes(1);
    expect(getBalanceRows).not.toHaveBeenCalled();
    expect(status.sourceId).toBe("legacy-bridge");
    expect(rows.map(row => String(row.balance))).toEqual(["7"]);
  });

  it("records the error on the slice when a source fails", async () => {
    syncBalanceRows.mockClear();
    syncBalanceRows.mockImplementationOnce(async () => {
      throw new Error("explorer unreachable");
    });
    const { status } = await readBalance(btcDescriptor);
    expect(status.error?.message).toBe("explorer unreachable");
  });

  it("keeps each invocation isolated — no state shared between runtimes", async () => {
    const first = runtimeFor(evmDescriptor);
    await first.scheduler.fetch({
      ref: accountRefOf(evmDescriptor),
      slices: ["balance"],
      reason: "test",
      maxAge: 0,
    });
    expect(first.rowsOf(EVM_ID)).toHaveLength(2);
    expect(runtimeFor(evmDescriptor).rowsOf(EVM_ID)).toEqual([]);
  });
});
