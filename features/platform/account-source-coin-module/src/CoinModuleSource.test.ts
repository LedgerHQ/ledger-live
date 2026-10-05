import type { AssetInfo, Operation } from "@ledgerhq/coin-module-framework/api/types";
import { AccountRefSchema, TokenAccountIdSchema, type AccountId } from "@domain/entity-account";
import { CoinModuleSource, type CoinModule, type CoinModuleSourceConfig } from "./CoinModuleSource";

const ref = AccountRefSchema.parse({
  accountId: "js:2:ethereum:0xabc:",
  currencyId: "ethereum",
  address: "0xabc",
  derivationMode: "",
});

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
    listOperations: jest.fn(async () => ({ items: [coreOperation()], next: undefined })),
    tokenOf: jest.fn(async (asset: AssetInfo) => {
      const reference = "assetReference" in asset ? asset.assetReference : undefined;
      const id = reference ? tokens[reference] : undefined;
      return id ? { id } : undefined;
    }),
    ...over,
  };
}

function makeSource(coinModule: CoinModule, over: Partial<CoinModuleSourceConfig> = {}) {
  return new CoinModuleSource({
    loadCoinModule: async () => coinModule,
    families: { balance: () => ["evm"], operations: () => ["evm"] },
    tokenAccountIdOf: (parentId: AccountId, tokenId: string) =>
      TokenAccountIdSchema.parse(`${parentId}+${encodeURIComponent(tokenId)}`),
    blacklistedTokenIds: () => ["ethereum/erc20/scam"],
    ...over,
  });
}

describe("CoinModuleSource", () => {
  describe("supports", () => {
    it("is gated per datum: a family served for balance says nothing about operations", () => {
      const source = makeSource(makeCoinModule(), {
        families: { balance: () => ["evm"], operations: () => [] },
      });
      expect(source.supports(ref, "balance")).toBe(true);
      expect(source.supports(ref, "operations")).toBe(false);
    });

    it("does not support an unknown currency or a family it was not given", () => {
      const source = makeSource(makeCoinModule(), { families: { balance: () => ["bitcoin"] } });
      expect(source.supports(ref, "balance")).toBe(false);
      expect(source.supports({ ...ref, currencyId: "nope" }, "balance")).toBe(false);
    });

    it("reads the gate on every call, so a flag flipped at runtime is honoured", () => {
      let served: string[] = [];
      const source = makeSource(makeCoinModule(), { families: { balance: () => served } });
      expect(source.supports(ref, "balance")).toBe(false);
      served = ["evm"];
      expect(source.supports(ref, "balance")).toBe(true);
    });
  });

  describe("balance", () => {
    it("returns the native row, then one row per known, non-blacklisted token", async () => {
      const rows = await makeSource(makeCoinModule()).balance(ref, undefined);
      expect(
        rows.map(row => [row.accountId, row.assetId, row.balance, row.spendableBalance]),
      ).toEqual([
        ["js:2:ethereum:0xabc:", "ethereum", "1000", "900"],
        [
          "js:2:ethereum:0xabc:+ethereum%2Ferc20%2Fusd__coin",
          "ethereum/erc20/usd__coin",
          "25",
          "25",
        ],
      ]);
      expect(rows[1].parentId).toBe(ref.accountId);
    });

    it("reports a zero native balance when the module returns none, and never a negative spendable", async () => {
      const coinModule = makeCoinModule({
        getBalance: jest.fn(async () => [{ asset: USDC, value: 5n, locked: 9n }]),
      });
      const [native, token] = await makeSource(coinModule).balance(ref, undefined);
      expect(native.balance).toBe("0");
      expect(token.spendableBalance).toBe("0");
    });

    it("rejects before reading when the signal is already aborted", async () => {
      const coinModule = makeCoinModule();
      const controller = new AbortController();
      controller.abort();
      await expect(
        makeSource(coinModule).balance(ref, undefined, controller.signal),
      ).rejects.toThrow(/aborted/);
      expect(coinModule.getBalance).not.toHaveBeenCalled();
    });
  });

  describe("operations", () => {
    it("maps a native OUT with the fee added to its value", async () => {
      const { operations, complete } = await makeSource(makeCoinModule()).operations(
        ref,
        undefined,
      );
      expect(complete).toBe(true);
      expect(operations).toEqual([
        {
          id: "js:2:ethereum:0xabc:-0xhash-OUT",
          accountId: "js:2:ethereum:0xabc:",
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
      ]);
    });

    it("reports only the fee as the value of a failed operation", async () => {
      const coinModule = makeCoinModule({
        listOperations: jest.fn(async () => ({
          items: [coreOperation({}, { failed: true })],
        })),
      });
      const [operation] = (await makeSource(coinModule).operations(ref, undefined)).operations;
      expect(operation.value).toBe("7");
      expect(operation.hasFailed).toBe(true);
    });

    it("fans a token operation out to its token account, and drops an unknown token's", async () => {
      const coinModule = makeCoinModule({
        listOperations: jest.fn(async () => ({
          items: [
            coreOperation({
              type: "IN",
              asset: USDC,
              value: 25n,
              details: { parentSenders: ["0xrouter"], parentRecipients: ["0xabc"] },
            }),
            coreOperation({ asset: UNKNOWN }),
          ],
        })),
      });
      const { operations } = await makeSource(coinModule).operations(ref, undefined);
      expect(operations).toHaveLength(1);
      expect(operations[0]).toMatchObject({
        accountId: "js:2:ethereum:0xabc:+ethereum%2Ferc20%2Fusd__coin",
        assetId: "ethereum/erc20/usd__coin",
        value: "25",
        senders: ["0xrouter"],
        recipients: ["0xabc"],
      });
    });

    it("passes the query through and hands back the module's cursor", async () => {
      const coinModule = makeCoinModule({
        listOperations: jest.fn(async () => ({ items: [], next: "c2" })),
      });
      const page = await makeSource(coinModule).operations(ref, { cursor: "c1", limit: 10 });
      expect(coinModule.listOperations).toHaveBeenCalledWith("0xabc", { cursor: "c1", limit: 10 });
      expect(page).toEqual({ operations: [], nextCursor: "c2", complete: false });
    });

    it("treats an empty cursor as the end of the history", async () => {
      const coinModule = makeCoinModule({
        listOperations: jest.fn(async () => ({ items: [], next: "" })),
      });
      expect((await makeSource(coinModule).operations(ref, undefined)).complete).toBe(true);
    });
  });
});
