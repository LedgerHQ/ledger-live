import { describe, expect, it } from "bun:test";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import { HumanFormatter } from "./human";
import { JsonFormatter } from "./json";
import type { DiscoveredAccount, AccountDescriptor } from "../models";
import { BalanceSchema, OperationSchema } from "../models";
import { XPUB, ETH_ADDR } from "../../shared/accountDescriptor/test-fixtures";
import { USDT_TOKEN_INFO } from "../../test/helpers/cal-fixtures";

const stubStore = {} as CryptoAssetsStore;

const btcDiscovered: DiscoveredAccount = {
  descriptor: {
    purpose: "account",
    version: "1",
    type: "utxo",
    network: { name: "bitcoin", env: "main" },
    xpub: XPUB,
    path: "m/84h/0h/0h",
  },
  freshAddress: "bc1qexample",
  label: "bitcoin-native-1",
};

const ethDiscovered: DiscoveredAccount = {
  descriptor: {
    purpose: "account",
    version: "1",
    type: "address",
    network: { name: "ethereum", env: "main" },
    address: ETH_ADDR,
    path: "m/44h/60h/0h/0/0",
  },
  freshAddress: ETH_ADDR,
  label: "ethereum-1",
};

const btcDescriptor: AccountDescriptor = {
  id: `js:2:bitcoin:${XPUB}:native_segwit`,
  currencyId: "bitcoin",
  freshAddress: "bc1qexample",
  seedIdentifier: XPUB,
  derivationMode: "native_segwit",
  index: 2,
};

describe("HumanFormatter.formatTokenInfo", () => {
  const formatter = new HumanFormatter(stubStore);

  it("includes the token id, ticker, name, contract, parent, type, decimals", () => {
    const out = formatter.formatTokenInfo(USDT_TOKEN_INFO);
    expect(out).toContain("ethereum/erc20/usd_tether__erc20_");
    expect(out).toContain("USDT");
    expect(out).toContain("Tether USD");
    expect(out).toContain("0xdac17f958d2ee523a2206206994597c13d831ec7");
    expect(out).toContain("ethereum");
    expect(out).toContain("erc20");
    expect(out).toContain("6");
  });

  it("does not render a delisted warning by default", () => {
    expect(formatter.formatTokenInfo(USDT_TOKEN_INFO)).not.toMatch(/delisted/i);
  });

  it("renders a delisted warning when the flag is set", () => {
    const out = formatter.formatTokenInfo({ ...USDT_TOKEN_INFO, delisted: true });
    expect(out).toMatch(/delisted/i);
  });
});

describe("JsonFormatter.token", () => {
  const json = new JsonFormatter({} as unknown as HumanFormatter);

  it("returns the TokenInfo payload as-is", () => {
    expect(json.token(USDT_TOKEN_INFO)).toEqual(USDT_TOKEN_INFO);
  });

  it("omits delisted when absent on input", () => {
    expect("delisted" in json.token(USDT_TOKEN_INFO)).toBe(false);
  });

  it("preserves delisted=true when set", () => {
    const out = json.token({ ...USDT_TOKEN_INFO, delisted: true });
    expect(out.delisted).toBe(true);
  });
});

describe("HumanFormatter.formatError", () => {
  it("returns message for Error instances", () => {
    expect(HumanFormatter.formatError(new Error("boom"))).toBe("boom");
  });

  it("JSON-serializes non-Error objects", () => {
    const out = HumanFormatter.formatError({ code: 42 });
    expect(out).toBe('{"code":42}');
  });

  it("stringifies primitives", () => {
    expect(HumanFormatter.formatError("oops")).toBe('"oops"');
  });
});

describe("HumanFormatter.formatDiscoveredAccount", () => {
  const formatter = new HumanFormatter(stubStore);

  it("contains the session label", () => {
    expect(formatter.formatDiscoveredAccount(btcDiscovered)).toContain("bitcoin-native-1");
  });

  it("contains the fresh address", () => {
    expect(formatter.formatDiscoveredAccount(btcDiscovered)).toContain("bc1qexample");
  });

  it("does not leak the serialized V1 descriptor", () => {
    const out = formatter.formatDiscoveredAccount(btcDiscovered);
    expect(out).not.toContain(`account:1:utxo:bitcoin:main:${XPUB}:m/84h/0h/0h`);
  });

  it("works for address-type (ethereum)", () => {
    const out = formatter.formatDiscoveredAccount(ethDiscovered);
    expect(out).toContain("ethereum-1");
    expect(out).toContain(ETH_ADDR);
  });
});

describe("HumanFormatter.formatAccountDescriptor", () => {
  const formatter = new HumanFormatter(stubStore);

  it("contains currencyId", () => {
    expect(formatter.formatAccountDescriptor(btcDescriptor)).toContain("bitcoin");
  });

  it("contains account index", () => {
    expect(formatter.formatAccountDescriptor(btcDescriptor)).toContain("#2");
  });

  it("contains the fresh address", () => {
    expect(formatter.formatAccountDescriptor(btcDescriptor)).toContain("bc1qexample");
  });
});

describe("JsonFormatter.discoveredAccounts", () => {
  it("returns label + freshAddress objects (no descriptor)", () => {
    const result = JsonFormatter.discoveredAccounts([btcDiscovered, ethDiscovered]);
    expect(result).toEqual([
      { label: "bitcoin-native-1", freshAddress: "bc1qexample" },
      { label: "ethereum-1", freshAddress: ETH_ADDR },
    ]);
  });

  it("returns empty array for no accounts", () => {
    expect(JsonFormatter.discoveredAccounts([])).toEqual([]);
  });
});

const mockHuman = {
  formatAmount: async (val: string, _id: string) => `${val} formatted`,
} as unknown as HumanFormatter;

describe("JsonFormatter.balances", () => {
  it("maps balances to asset + formatted amount", async () => {
    const json = new JsonFormatter(mockHuman);
    const balances = [BalanceSchema.parse({ assetId: "bitcoin", balance: "100000000" })];
    const result = await json.balances(balances);
    expect(result).toEqual([{ asset: "bitcoin", amount: "100000000 formatted" }]);
  });
});

describe("HumanFormatter.formatAmount", () => {
  const formatter = new HumanFormatter(stubStore);

  it("formats a known ETH amount", async () => {
    const result = await formatter.formatAmount("1000000000000000000", "ethereum");
    expect(result).toContain("ETH");
  });

  it("formats zero", async () => {
    const result = await formatter.formatAmount("0", "ethereum");
    expect(result).toContain("ETH");
  });

  it("throws for unknown assetId", async () => {
    const storeWithNoToken = {
      findTokenById: async () => undefined,
    } as unknown as CryptoAssetsStore;
    const f = new HumanFormatter(storeWithNoToken);
    await expect(f.formatAmount("100", "notacurrency")).rejects.toThrow(/Unknown/);
  });

  it("does not query store for known built-in currencies (ethereum)", async () => {
    const calls: string[] = [];
    const countingStore = {
      findTokenById: async (id: string) => {
        calls.push(id);
        return undefined;
      },
    } as unknown as CryptoAssetsStore;
    const f = new HumanFormatter(countingStore);
    await f.formatAmount("1000000000000000000", "ethereum");
    await f.formatAmount("2000000000000000000", "ethereum");
    // ethereum is resolved via findCryptoCurrencyById, store never called
    expect(calls).toHaveLength(0);
  });
});

describe("HumanFormatter.formatBalance", () => {
  const formatter = new HumanFormatter(stubStore);

  it("formats a non-zero balance", async () => {
    const result = await formatter.formatBalance(
      BalanceSchema.parse({ assetId: "ethereum", balance: "1000000000000000000" }),
    );
    expect(result).toContain("ETH");
  });

  it("formats a zero balance", async () => {
    const result = await formatter.formatBalance(
      BalanceSchema.parse({ assetId: "ethereum", balance: "0" }),
    );
    expect(result).toContain("ETH");
  });
});

describe("HumanFormatter.formatOperation", () => {
  const formatter = new HumanFormatter(stubStore);

  const op = OperationSchema.parse({
    id: "op1",
    hash: "0xdeadbeef",
    type: "OUT",
    value: "500000000000000000",
    fee: "21000000000000",
    senders: ["0xsender"],
    recipients: ["0xrecipient"],
    blockHeight: 19000000,
    accountId: "acc1",
    assetId: "ethereum",
    date: "2024-06-01T12:00:00.000Z",
  });

  it("contains the hash", async () => {
    const result = await formatter.formatOperation(op, "ethereum");
    expect(result).toContain("0xdeadbeef");
  });

  it("contains sender and recipient", async () => {
    const result = await formatter.formatOperation(op, "ethereum");
    expect(result).toContain("0xsender");
    expect(result).toContain("0xrecipient");
  });

  it("formats a pending operation (null blockHeight)", async () => {
    const result = await formatter.formatOperation({ ...op, blockHeight: null }, "ethereum");
    expect(result).toContain("pending");
  });

  it("formats an IN operation", async () => {
    const result = await formatter.formatOperation({ ...op, type: "IN" }, "ethereum");
    expect(result).toContain("IN");
  });
});

describe("JsonFormatter.operations", () => {
  const json = new JsonFormatter(mockHuman);

  it("maps operations to the expected shape", async () => {
    const op = OperationSchema.parse({
      id: "op1",
      hash: "0xabc",
      type: "OUT",
      value: "1000",
      fee: "100",
      senders: ["0xsender"],
      recipients: ["0xrecipient"],
      blockHeight: 123,
      accountId: "acc1",
      assetId: "ethereum",
      date: "2024-01-01T00:00:00.000Z",
    });
    const result = await json.operations([op], "ethereum", "account:1:...");
    expect(result).toHaveLength(1);
    expect(result[0].hash).toBe("0xabc");
    expect(result[0].type).toBe("OUT");
    expect(result[0].senders).toEqual(["0xsender"]);
    expect(result[0].blockHeight).toBe(123);
    expect(result[0].accountId).toBe("account:1:...");
    expect(result[0].parentId).toBeUndefined();
  });

  it("includes parentId when present", async () => {
    const op = OperationSchema.parse({
      id: "op2",
      hash: "0xdef",
      type: "IN",
      value: "500",
      fee: "50",
      senders: [],
      recipients: [],
      blockHeight: null,
      accountId: "acc1",
      assetId: "ethereum",
      date: "2024-01-01T00:00:00.000Z",
      parentId: "parent1",
    });
    const result = await json.operations([op], "ethereum", "acct");
    expect(result[0].parentId).toBe("parent1");
  });
});
