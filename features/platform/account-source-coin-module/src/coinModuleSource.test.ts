import type { AssetInfo, Operation } from "@ledgerhq/coin-module-framework/api/types";
import { computeAccountUUID, type AccountDescriptor } from "@domain/entity-account-descriptor";
import {
  createCoinModuleSource,
  type CoinModule,
  type CoinModuleSourceConfig,
} from "./coinModuleSource";

const descriptor: AccountDescriptor = {
  purpose: "account",
  version: "1",
  type: "address",
  network: { name: "ethereum", env: "main" },
  address: "0xabc",
  path: "m/44h/60h/0h/0/0",
};

const target = { accountUUID: computeAccountUUID(descriptor), descriptor };

const USDC = { type: "erc20", assetReference: "0xusdc" };
const SCAM = { type: "erc20", assetReference: "0xscam" };
const UNKNOWN = { type: "erc20", assetReference: "0xunknown" };

const tokens: Record<string, string> = {
  "0xusdc": "ethereum/erc20/usd__coin",
  "0xscam": "ethereum/erc20/scam",
};

const coreOperation = (
  over: Partial<Operation> = {},
  tx: Partial<Operation["tx"]> = {},
): Operation => ({
  id: "core-id",
  type: "OUT",
  senders: ["0xabc"],
  recipients: ["0xdef"],
  value: 100n,
  asset: { type: "native" },
  tx: {
    hash: "0xhash",
    block: { height: 42, hash: "0xblock", time: new Date("2026-01-31T12:00:00.000Z") },
    fees: 7n,
    date: new Date("2026-01-31T12:00:00.000Z"),
    failed: false,
    ...tx,
  },
  ...over,
});

function makeCoinModule(over: Partial<CoinModule> = {}): CoinModule {
  return {
    getBalance: jest.fn(async () => [
      { asset: { type: "native" }, value: 1000n, locked: 100n },
      { asset: USDC, value: 25n },
      { asset: SCAM, value: 1n },
      { asset: UNKNOWN, value: 9n },
    ]),
    listOperations: jest.fn(async () => ({ items: [coreOperation()], next: "" })),
    tokenOf: jest.fn(async (asset: AssetInfo) => {
      const reference = "assetReference" in asset ? asset.assetReference : undefined;
      const id = reference ? tokens[reference] : undefined;
      return id ? { id } : undefined;
    }),
    ...over,
  };
}

function makeSource(coinModule: CoinModule, over: Partial<CoinModuleSourceConfig> = {}) {
  return createCoinModuleSource({
    loadCoinModule: async () => coinModule,
    families: { balance: () => ["evm"], operations: () => ["evm"] },
    blacklistedTokenIds: () => ["ethereum/erc20/scam"],
    ...over,
  });
}

describe("createCoinModuleSource", () => {
  describe("supports", () => {
    it("serves the families it is given, per kind", () => {
      const source = makeSource(makeCoinModule(), { families: { balance: () => ["evm"] } });
      expect(source.supports(descriptor, "balance")).toBe(true);
      expect(source.supports(descriptor, "operations")).toBe(false);
    });

    it("does not serve an unknown network", () => {
      const unknown = { ...descriptor, network: { name: "nope", env: "main" as const } };
      expect(makeSource(makeCoinModule()).supports(unknown, "balance")).toBe(false);
    });

    it("reads the families on every call, so a flag flipped at runtime is honoured", () => {
      let served: string[] = [];
      const source = makeSource(makeCoinModule(), { families: { balance: () => served } });
      expect(source.supports(descriptor, "balance")).toBe(false);
      served = ["evm"];
      expect(source.supports(descriptor, "balance")).toBe(true);
    });
  });

  describe("balance", () => {
    it("answers the native row first, then one row per known token that is not blacklisted", async () => {
      const rows = await makeSource(makeCoinModule()).read.balance(target);
      expect(rows.map(row => [row.assetId, row.balance, row.spendableBalance])).toEqual([
        ["ethereum", "1000", "900"],
        ["ethereum/erc20/usd__coin", "25", "25"],
      ]);
    });

    it("takes the first native row as the total when the module does not partition it", async () => {
      const coinModule = makeCoinModule({
        getBalance: async () => [
          { asset: { type: "native" }, value: 15n },
          { asset: { type: "native" }, value: 5n },
        ],
      });
      expect(await makeSource(coinModule).read.balance(target)).toEqual([
        { assetId: "ethereum", balance: "15", spendableBalance: "15" },
      ]);
    });

    it("sums the native partitions, as the full sync does", async () => {
      const coinModule = makeCoinModule({
        partitionsNativeBalance: true,
        getBalance: async () => [
          { asset: { type: "native" }, value: 10n },
          { asset: { type: "native" }, value: 5n, locked: 5n },
        ],
      });
      expect(await makeSource(coinModule).read.balance(target)).toEqual([
        { assetId: "ethereum", balance: "15", spendableBalance: "10" },
      ]);
    });

    it("answers a zero native row when the module reports none", async () => {
      const coinModule = makeCoinModule({ getBalance: async () => [] });
      expect(await makeSource(coinModule).read.balance(target)).toEqual([
        { assetId: "ethereum", balance: "0", spendableBalance: "0" },
      ]);
    });
  });

  describe("operations", () => {
    it("maps one page, the native value including the fee the account paid", async () => {
      const page = await makeSource(makeCoinModule()).read.operations(target, undefined);
      expect(page).toEqual({
        operations: [
          {
            id: "core-id-ethereum",
            assetId: "ethereum",
            hash: "0xhash",
            type: "OUT",
            value: "107",
            fee: "7",
            senders: ["0xabc"],
            recipients: ["0xdef"],
            blockHeight: 42,
            date: "2026-01-31T12:00:00.000Z",
            hasFailed: false,
          },
        ],
      });
    });

    it("hands the cursor and the limit to the module, and its next cursor back", async () => {
      const listOperations = jest.fn(async () => ({ items: [], next: "page-3" }));
      const source = makeSource(makeCoinModule({ listOperations }));
      const page = await source.read.operations({ ...target, cursor: "page-2" }, { limit: 20 });
      expect(listOperations).toHaveBeenCalledWith("0xabc", { cursor: "page-2", limit: 20 });
      expect(page.nextCursor).toBe("page-3");
    });

    it("puts a token operation on its token, and drops one on an unknown token", async () => {
      const listOperations = async () => ({
        items: [
          coreOperation({ type: "IN", asset: USDC, value: 5n }),
          coreOperation({ type: "IN", asset: UNKNOWN, value: 1n }),
        ],
        next: "",
      });
      const page = await makeSource(makeCoinModule({ listOperations })).read.operations(
        target,
        undefined,
      );
      expect(page.operations.map(each => [each.assetId, each.value])).toEqual([
        ["ethereum/erc20/usd__coin", "5"],
      ]);
    });

    it("names the token's own counterparties on a token row, the transaction's on a native row", async () => {
      const details = {
        assetSenders: ["0xholder"],
        assetRecipients: ["0xpayee"],
        parentSenders: ["0xsigner"],
        parentRecipients: ["0xcontract"],
      };
      const listOperations = async () => ({
        items: [
          coreOperation({ type: "OUT", asset: USDC, value: 5n, details }),
          coreOperation({ type: "FEES", details }),
        ],
        next: "",
      });
      const page = await makeSource(makeCoinModule({ listOperations })).read.operations(
        target,
        undefined,
      );
      expect(page.operations.map(each => [each.assetId, each.senders, each.recipients])).toEqual([
        ["ethereum/erc20/usd__coin", ["0xholder"], ["0xpayee"]],
        ["ethereum", ["0xsigner"], ["0xcontract"]],
      ]);
    });

    it("leaves out a fee another account paid, but not on a failed call, as the full sync", async () => {
      const listOperations = async () => ({
        items: [
          coreOperation({ id: "sponsored" }, { feesPayer: "0xrelayer" }),
          coreOperation({ id: "own" }, { feesPayer: "0xABC" }),
          coreOperation({ id: "failed" }, { feesPayer: "0xrelayer", failed: true }),
        ],
        next: "",
      });
      const page = await makeSource(makeCoinModule({ listOperations })).read.operations(
        target,
        undefined,
      );
      expect(page.operations.map(each => [each.id, each.value])).toEqual([
        ["sponsored-ethereum", "100"],
        ["own-ethereum", "107"],
        ["failed-ethereum", "7"],
      ]);
    });

    it("values a failed token transfer at zero: its fee is the native coin's", async () => {
      const listOperations = async () => ({
        items: [coreOperation({ asset: USDC, value: 5n }, { failed: true })],
        next: "",
      });
      const page = await makeSource(makeCoinModule({ listOperations })).read.operations(
        target,
        undefined,
      );
      expect(page.operations[0]).toEqual(expect.objectContaining({ value: "0", hasFailed: true }));
    });

    it("drops the operations of a blacklisted token, keeping the next cursor", async () => {
      const listOperations = async () => ({
        items: [coreOperation({ type: "IN", asset: SCAM, value: 1n })],
        next: "page-2",
      });
      const page = await makeSource(makeCoinModule({ listOperations })).read.operations(
        target,
        undefined,
      );
      expect(page).toEqual({ operations: [], nextCursor: "page-2" });
    });

    it("drops a failed incoming transfer, which the account never received", async () => {
      const listOperations = async () => ({
        items: [coreOperation({ type: "IN" }, { failed: true })],
        next: "",
      });
      const page = await makeSource(makeCoinModule({ listOperations })).read.operations(
        target,
        undefined,
      );
      expect(page.operations).toEqual([]);
    });

    it("reports a failed operation as costing its fee only", async () => {
      const listOperations = async () => ({
        items: [coreOperation({}, { failed: true })],
        next: "",
      });
      const page = await makeSource(makeCoinModule({ listOperations })).read.operations(
        target,
        undefined,
      );
      expect(page.operations[0]).toEqual(expect.objectContaining({ value: "7", hasFailed: true }));
    });
  });
});
