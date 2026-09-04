import { describe, expect, it, mock } from "bun:test";
import { accountRefOf, readDescriptorBalances } from "./accountData";
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

const row = (
  accountId: string,
  assetId: string,
  balance: string,
  extra: Partial<AccountBalance> = {},
): AccountBalance =>
  ({
    accountId: AccountIdSchema.parse(accountId),
    assetId: CryptoCurrencyIdSchema.parse(assetId),
    balance: BigNumberStrSchema.parse(balance),
    spendableBalance: BigNumberStrSchema.parse(balance),
    at: DateTimeIsoSchema.parse("2026-01-31T12:00:00.000Z"),
    ...extra,
  }) as AccountBalance;

const getBalanceRows = mock(async () => [
  row(EVM_ID, "ethereum", "1500", {
    spendableBalance: BigNumberStrSchema.parse("1400"),
  } as Partial<AccountBalance>),
  row(`${EVM_ID}+ethereum%2Ferc20%2Fusd__coin`, "ethereum", "42", {
    assetId: TokenCurrencyIdSchema.parse("ethereum/erc20/usd__coin"),
    parentId: AccountIdSchema.parse(EVM_ID),
  } as Partial<AccountBalance>),
]);

const syncBalanceRows = mock(async () => [row(BTC_ID, "bitcoin", "7")]);

// Injected, never `mock.module`: the command tests run the CLI in process, so a module mock on a
// shared module bleeds into them (see the warning in src/test/helpers/cli-runner.ts).
const getOperationRows = mock(async () => [] as never[]);

const adapters = {
  loadCoinFramework: async () => ({ getBalanceRows }),
  loadBridge: async () => ({ getBalanceRows: syncBalanceRows, getOperationRows }),
};

const read = (descriptor: AccountDescriptor) => readDescriptorBalances(descriptor, adapters);

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

describe("readDescriptorBalances", () => {
  it("reads a granular family straight from the coin module, with no full sync", async () => {
    getBalanceRows.mockClear();
    syncBalanceRows.mockClear();
    const rows = await read(evmDescriptor);
    expect(getBalanceRows).toHaveBeenCalledTimes(1);
    expect(syncBalanceRows).not.toHaveBeenCalled();
    expect(rows.map(row => [String(row.assetId), String(row.balance)])).toEqual([
      ["ethereum", "1500"],
      ["ethereum/erc20/usd__coin", "42"],
    ]);
  });

  it("returns native and token balances from that single call, account row first", async () => {
    const rows = await read(evmDescriptor);
    expect(rows).toHaveLength(2);
    expect(rows[0].parentId).toBeUndefined();
    expect(String(rows[0].spendableBalance)).toBe("1400");
    expect(String(rows[1].parentId)).toBe(EVM_ID);
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
    await read(xrpDescriptor);
    expect(syncBalanceRows).toHaveBeenCalledTimes(1);
    expect(getBalanceRows).not.toHaveBeenCalled();
  });

  it("falls back to the full bridge sync outside the narrowed set", async () => {
    getBalanceRows.mockClear();
    syncBalanceRows.mockClear();
    const rows = await read(btcDescriptor);
    expect(syncBalanceRows).toHaveBeenCalledTimes(1);
    expect(getBalanceRows).not.toHaveBeenCalled();
    expect(rows.map(row => String(row.balance))).toEqual(["7"]);
  });

  it("propagates a source failure rather than reporting an empty balance", async () => {
    syncBalanceRows.mockClear();
    syncBalanceRows.mockImplementationOnce(async () => {
      throw new Error("explorer unreachable");
    });
    expect(read(btcDescriptor)).rejects.toThrow("explorer unreachable");
  });

  it("throws when no source supports the currency", async () => {
    const unknown: AccountDescriptor = {
      id: "js:2:nope:0x0:",
      currencyId: "nope",
      freshAddress: "0x0",
      seedIdentifier: "0x0",
      derivationMode: "",
      index: 0,
    };
    expect(read(unknown)).rejects.toThrow("No account balance source");
  });
});
