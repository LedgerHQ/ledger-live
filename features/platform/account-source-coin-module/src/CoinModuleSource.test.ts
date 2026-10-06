import type { AssetInfo, Operation } from "@ledgerhq/coin-module-framework/api/types";
import { AccountIdSchema, TokenAccountIdSchema, type AccountId } from "@domain/entity-account";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { CoinModuleSource, type CoinModule, type CoinModuleSourceConfig } from "./CoinModuleSource";

const descriptor: AccountDescriptor = {
  purpose: "account",
  version: "1",
  type: "address",
  network: { name: "ethereum", env: "main" },
  address: "0xabc",
  path: "m/44h/60h/0h/0/0",
};

const accountId = AccountIdSchema.parse("js:2:ethereum:0xabc:");

const target = { accountId, descriptor };

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
    it("supports an account of a served family", () => {
      expect(makeSource(makeCoinModule()).supports(descriptor, "balance")).toBe(true);
    });

    it("supports a UTXO account of a served family", () => {
      const source = makeSource(makeCoinModule(), { families: { balance: () => ["bitcoin"] } });
      expect(
        source.supports(
          {
            purpose: "account",
            version: "1",
            type: "utxo",
            network: { name: "bitcoin", env: "main" },
            xpub: "xpub123",
            path: "m/84h/0h/0h",
          },
          "balance",
        ),
      ).toBe(true);
    });

    it("is gated per datum: a family served for balance says nothing about operations", () => {
      const source = makeSource(makeCoinModule(), {
        families: { balance: () => ["evm"], operations: () => [] },
      });
      expect(source.supports(descriptor, "balance")).toBe(true);
      expect(source.supports(descriptor, "operations")).toBe(false);
    });

    it("does not support a datum it has no families for", () => {
      const source = makeSource(makeCoinModule(), { families: { balance: () => ["evm"] } });
      expect(source.supports(descriptor, "operations")).toBe(false);
    });

    it("does not support a family it was not given", () => {
      const source = makeSource(makeCoinModule(), { families: { balance: () => ["bitcoin"] } });
      expect(source.supports(descriptor, "balance")).toBe(false);
    });

    it("does not support an unknown network", () => {
      expect(
        makeSource(makeCoinModule()).supports(
          { ...descriptor, network: { name: "nope", env: "main" } },
          "balance",
        ),
      ).toBe(false);
    });

    it("reads the gate on every call, so a flag flipped at runtime is honoured", () => {
      let served: string[] = [];
      const source = makeSource(makeCoinModule(), { families: { balance: () => served } });
      expect(source.supports(descriptor, "balance")).toBe(false);
      served = ["evm"];
      expect(source.supports(descriptor, "balance")).toBe(true);
    });
  });

  describe("balance", () => {
    it("returns the native row, then one row per known, non-blacklisted token", async () => {
      const rows = await makeSource(makeCoinModule()).balance(target, undefined);
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
      expect(rows[1].parentId).toBe(accountId);
    });

    it("reports a zero native balance when the module returns none, and never a negative spendable", async () => {
      const coinModule = makeCoinModule({
        getBalance: jest.fn(async () => [{ asset: USDC, value: 5n, locked: 9n }]),
      });
      const [native, token] = await makeSource(coinModule).balance(target, undefined);
      expect(native.balance).toBe("0");
      expect(token.spendableBalance).toBe("0");
    });

    it("rejects before reading when the signal is already aborted", async () => {
      const coinModule = makeCoinModule();
      const controller = new AbortController();
      controller.abort();
      await expect(
        makeSource(coinModule).balance(target, undefined, controller.signal),
      ).rejects.toThrow(/aborted/);
      expect(coinModule.getBalance).not.toHaveBeenCalled();
    });
  });

  describe("operations", () => {
    it("maps a native OUT with the fee added to its value", async () => {
      const { operations, complete } = await makeSource(makeCoinModule()).operations(
        target,
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
      const [operation] = (await makeSource(coinModule).operations(target, undefined)).operations;
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
      const { operations } = await makeSource(coinModule).operations(target, undefined);
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
      const page = await makeSource(coinModule).operations(target, { cursor: "c1", limit: 10 });
      expect(coinModule.listOperations).toHaveBeenCalledWith("0xabc", { cursor: "c1", limit: 10 });
      expect(page).toEqual({ operations: [], nextCursor: "c2", complete: false });
    });

    it("treats an empty cursor as the end of the history", async () => {
      const coinModule = makeCoinModule({
        listOperations: jest.fn(async () => ({ items: [], next: "" })),
      });
      expect((await makeSource(coinModule).operations(target, undefined)).complete).toBe(true);
    });
  });
  describe("exists", () => {
    const noOperations = async () => ({ items: [], next: undefined });
    const nativeBalance = (value: bigint) => async () => [{ asset: { type: "native" }, value }];

    it("says yes on the first operation, without reading the balance", async () => {
      const coinModule = makeCoinModule();
      expect(await makeSource(coinModule).exists(target)).toBe(true);
      expect(coinModule.listOperations).toHaveBeenCalledWith("0xabc", { limit: 1 });
      expect(coinModule.getBalance).not.toHaveBeenCalled();
    });

    it("says yes for an account with a balance and no history", async () => {
      const coinModule = makeCoinModule({
        listOperations: jest.fn(noOperations),
        getBalance: jest.fn(nativeBalance(5n)),
      });
      expect(await makeSource(coinModule).exists(target)).toBe(true);
    });

    it("says no for an account with neither", async () => {
      const coinModule = makeCoinModule({
        listOperations: jest.fn(noOperations),
        getBalance: jest.fn(nativeBalance(0n)),
      });
      expect(await makeSource(coinModule).exists(target)).toBe(false);
    });

    it("is supported for the families the source serves for any datum", () => {
      const source = makeSource(makeCoinModule(), {
        families: { balance: () => [], operations: () => ["evm"] },
      });
      expect(source.supportsExists(descriptor)).toBe(true);
      expect(
        makeSource(makeCoinModule(), { families: { balance: () => [] } }).supportsExists(
          descriptor,
        ),
      ).toBe(false);
    });

    it("does not start when already aborted", async () => {
      const coinModule = makeCoinModule();
      const controller = new AbortController();
      controller.abort();
      await expect(makeSource(coinModule).exists(target, controller.signal)).rejects.toThrow();
      expect(coinModule.listOperations).not.toHaveBeenCalled();
    });
  });
});
