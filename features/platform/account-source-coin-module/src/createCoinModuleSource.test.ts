import { createAccountDataRouter, type AccountDataSource } from "@domain/api-account-data";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { AccountDataSourceIdSchema } from "@domain/entity-account-data";
import {
  NetworkIdSchema,
  computeAccountUUID,
  type AccountDescriptor,
} from "@domain/entity-account-descriptor";
import type { Balance } from "@ledgerhq/coin-module-framework/api/types";
import type {
  CoinModuleBalanceApi,
  CoinModuleHost,
  CoinModuleOperation,
  CoinModuleOperationsPage,
} from "./host";
import { createCoinModuleSource } from "./createCoinModuleSource";
import { MAX_PAGES_PER_READ } from "./internals/readOperationsPage";

const XPUB =
  "xpub6BosfCnifzxcFwrSzQiqu2DBVTshkCXacvNsWGYJVVhhawA7d4R5WSE1S2G4UrqdKFNvJx3bR7MNfYTc4FXnAFzBVNMcJYHx5ENKnG9WNzh";

const utxo: AccountDescriptor = {
  purpose: "account",
  version: "2",
  type: "utxo",
  network: NetworkIdSchema.parse("bitcoin"),
  xpub: XPUB,
  path: "m/84h/0h/0h",
};

const address = (network: string, value: string): AccountDescriptor => ({
  purpose: "account",
  version: "2",
  type: "address",
  network: NetworkIdSchema.parse(network),
  address: value,
  path: "m/44h/60h/0h/0/0",
});

const ethereum = address("ethereum", "0xabc");

const USDT = "ethereum/erc20/usd_tether__erc20_";
const USDT_ASSET = { type: "erc20", assetReference: "0xdac17f958d2ee523a2206206994597c13d831ec7" };
const SPAM_ASSET = { type: "erc20", assetReference: "0xspam" };

const tokenIds: Record<string, string> = {
  [USDT_ASSET.assetReference]: USDT,
  [SPAM_ASSET.assetReference]: "ethereum/erc20/spam",
};

const hostOf = (
  balances: Record<string, Balance[]>,
  options: Partial<CoinModuleBalanceApi> & { blacklist?: string[]; readsXpub?: boolean } = {},
) => {
  const getBalance = jest.fn(async (subject: string) => balances[subject] ?? []);
  const getApi = jest.fn(async (_currencyId: string): Promise<CoinModuleBalanceApi> => ({
    getBalance,
    getTokenId: async asset =>
      "assetReference" in asset && asset.assetReference
        ? tokenIds[asset.assetReference]
        : undefined,
    ...options,
  }));
  const host: CoinModuleHost = {
    isCurrencySupported: id => ["bitcoin", "ethereum"].includes(id),
    readsXpub: id => (options.readsXpub ?? true) && id === "bitcoin",
    getApi,
    blacklistedTokenIds: () => options.blacklist ?? [],
  };
  return { host, getBalance, getApi };
};

const fallback: AccountDataSource = {
  id: AccountDataSourceIdSchema.parse("full-sync"),
  supports: () => true,
  read: { balance: async () => [], operations: async () => ({ operations: [] }) },
};

const nativeOperation = (hash: string, date: string): CoinModuleOperation => ({
  id: `${hash}-IN`,
  type: "IN",
  senders: ["0xdef"],
  recipients: ["0xabc"],
  value: 1n,
  asset: { type: "native" },
  tx: { hash, block: { height: 1 }, fees: 0n, date: new Date(date), failed: false },
});

/** The coin module's pages of `0xabc`, keyed by the cursor that reads each; the first one by `""`. */
const operationsHostOf = (
  pages: Record<string, CoinModuleOperationsPage>,
  { paginates = true }: { paginates?: boolean } = {},
) => {
  const listOperations = jest.fn(
    async (_subject: string, { cursor }: { cursor?: string; limit?: number }) =>
      pages[cursor ?? ""] ?? { items: [] },
  );
  const getOperationsApi = jest.fn(async (_currencyId: string) => ({ listOperations }));
  const host: CoinModuleHost = {
    ...hostOf({}).host,
    paginatesOperations: id => paginates && id === "ethereum",
    getOperationsApi,
  };
  return { host, listOperations, getOperationsApi };
};

const idsOf = ({ operations }: { operations: { id: string }[] }) => operations.map(({ id }) => id);

const readBalance = (host: CoinModuleHost, descriptor: AccountDescriptor) =>
  createAccountDataRouter([createCoinModuleSource(host)]).read("balance", descriptor);

const targetOf = (descriptor: AccountDescriptor) => ({
  accountUUID: computeAccountUUID(descriptor),
  descriptor,
});

describe("createCoinModuleSource", () => {
  it("is named after the coin module", () => {
    expect(createCoinModuleSource(hostOf({}).host).id).toBe("coin-module");
  });

  describe("supports", () => {
    const { supports } = createCoinModuleSource(hostOf({}).host);

    it("serves a utxo and an account-based account whose currency has a registered coin module", () => {
      expect(supports(utxo, "balance")).toBe(true);
      expect(supports(ethereum, "balance")).toBe(true);
    });

    it("leaves out a currency without coin module, and a network no currency has", () => {
      expect(supports(address("ethereum_sepolia", "0x1"), "balance")).toBe(false);
      expect(supports(address("not_a_network", "0x1"), "balance")).toBe(false);
    });

    it("serves the operations of a currency only where its coin module pages them", () => {
      const paging = createCoinModuleSource(operationsHostOf({}).host);
      const notPaging = createCoinModuleSource(operationsHostOf({}, { paginates: false }).host);

      expect(paging.supports(ethereum, "operations")).toBe(true);
      expect(notPaging.supports(ethereum, "operations")).toBe(false);
      expect(notPaging.supports(ethereum, "balance")).toBe(true);
      expect(supports(ethereum, "operations")).toBe(false);
    });
  });

  describe("balance", () => {
    it("reads an account-based account by its address, native coin first, then its listed tokens", async () => {
      const { host, getBalance } = hostOf({
        "0xabc": [
          { value: 7n, asset: USDT_ASSET, locked: 2n },
          { value: 1_000n, asset: { type: "native" }, locked: 400n },
        ],
      });

      const { data } = await readBalance(host, ethereum);

      expect(getBalance).toHaveBeenCalledWith("0xabc");
      expect(data).toEqual([
        { assetId: "ethereum", balance: "1000", spendableBalance: "600" },
        { assetId: USDT, balance: "7", spendableBalance: "5" },
      ]);
    });

    it("reads a utxo account by its xpub", async () => {
      const { host, getBalance, getApi } = hostOf({
        [XPUB]: [{ value: 5_000n, asset: { type: "native" } }],
      });

      const { data } = await readBalance(host, utxo);

      expect(getApi).toHaveBeenCalledWith("bitcoin");
      expect(getBalance).toHaveBeenCalledWith(XPUB);
      expect(data).toEqual([{ assetId: "bitcoin", balance: "5000", spendableBalance: "5000" }]);
    });

    it("answers a zero native balance when the coin module reports none", async () => {
      const { host } = hostOf({ "0xabc": [] });

      await expect(readBalance(host, ethereum)).resolves.toMatchObject({
        data: [{ assetId: "ethereum", balance: "0", spendableBalance: "0" }],
      });
    });

    it("never reports a spendable amount above the balance or below zero", async () => {
      const { host } = hostOf({
        "0xabc": [{ value: 10n, asset: { type: "native" }, locked: 30n }],
      });

      await expect(readBalance(host, ethereum)).resolves.toMatchObject({
        data: [{ balance: "10", spendableBalance: "0" }],
      });
    });

    it("leaves out a token the host does not list or blacklists", async () => {
      const unlisted = { type: "erc20", assetReference: "0xunknown" };
      const { host } = hostOf(
        {
          "0xabc": [
            { value: 1n, asset: { type: "native" } },
            { value: 2n, asset: USDT_ASSET },
            { value: 3n, asset: SPAM_ASSET },
            { value: 4n, asset: unlisted },
          ],
        },
        { blacklist: ["ethereum/erc20/spam"] },
      );

      const { data } = await readBalance(host, ethereum);

      expect(data.map(({ assetId }) => assetId)).toEqual(["ethereum", USDT]);
    });

    it("takes the first native entry, or sums them when the family partitions its native balance", async () => {
      const entries: Balance[] = [
        { value: 100n, asset: { type: "native" }, locked: 10n },
        { value: 50n, asset: { type: "native" }, locked: 50n },
      ];

      const single = await readBalance(hostOf({ "0xabc": entries }).host, ethereum);
      const summed = await readBalance(
        hostOf({ "0xabc": entries }, { partitionsNativeBalance: true }).host,
        ethereum,
      );

      expect(single.data).toEqual([
        { assetId: "ethereum", balance: "100", spendableBalance: "90" },
      ]);
      expect(summed.data).toEqual([
        { assetId: "ethereum", balance: "150", spendableBalance: "90" },
      ]);
    });

    it("fails the read when the coin module does", async () => {
      const { host, getBalance } = hostOf({});
      getBalance.mockRejectedValueOnce(new Error("explorer down"));

      await expect(readBalance(host, ethereum)).rejects.toThrow("explorer down");
    });

    it("loads the coin module of each currency when it reads", async () => {
      const { host, getApi } = hostOf({});

      await readBalance(host, ethereum);

      expect(getApi).toHaveBeenCalledWith("ethereum");
    });

    it("reads the accounts of one tick one by one, each by its own address or xpub", async () => {
      const { host, getBalance } = hostOf({
        "0x1": [{ value: 1n, asset: { type: "native" } }],
        "0x2": [{ value: 2n, asset: { type: "native" } }],
        [XPUB]: [{ value: 3n, asset: { type: "native" } }],
      });
      const router = createAccountDataRouter([createCoinModuleSource(host)]);

      const answers = await Promise.all([
        router.read("balance", address("ethereum", "0x1")),
        router.read("balance", utxo),
        router.read("balance", address("ethereum", "0x2")),
      ]);

      expect(answers.map(({ data }) => data[0])).toEqual([
        { assetId: "ethereum", balance: "1", spendableBalance: "1" },
        { assetId: "bitcoin", balance: "3", spendableBalance: "3" },
        { assetId: "ethereum", balance: "2", spendableBalance: "2" },
      ]);
      expect(getBalance.mock.calls.map(([subject]) => subject).sort()).toEqual([
        "0x1",
        "0x2",
        XPUB,
      ]);
    });
  });

  describe("balance single", () => {
    it("reads one account, and throws what the coin module throws", async () => {
      const { host, getBalance } = hostOf({ [XPUB]: [{ value: 3n, asset: { type: "native" } }] });
      const read = createCoinModuleSource(host).read?.balance;

      await expect(read?.(targetOf(utxo), undefined)).resolves.toEqual([
        { assetId: "bitcoin", balance: "3", spendableBalance: "3" },
      ]);
      getBalance.mockRejectedValueOnce(new Error("explorer down"));
      await expect(read?.(targetOf(ethereum), undefined)).rejects.toThrow("explorer down");
    });
  });

  it("reads no batch, the router limiting and settling the accounts itself", () => {
    expect(createCoinModuleSource(hostOf({}).host).readBatch).toBeUndefined();
  });

  it("fails only the account of a currency whose coin module does not load", async () => {
    const { host, getApi } = hostOf({ [XPUB]: [{ value: 3n, asset: { type: "native" } }] });
    const loadApi = getApi.getMockImplementation()!;
    getApi.mockImplementation(async currencyId => {
      if (currencyId === "ethereum") throw new Error("chunk failed");
      return loadApi(currencyId);
    });
    const router = createAccountDataRouter([createCoinModuleSource(host)]);

    const answers = await Promise.allSettled([
      router.read("balance", ethereum),
      router.read("balance", utxo),
    ]);

    expect(answers.map(({ status }) => status)).toEqual(["rejected", "fulfilled"]);
  });

  it("falls through to the next ranked source for a utxo account when the coin module reads no xpub", async () => {
    const { host, getApi } = hostOf({}, { readsXpub: false });
    const router = createAccountDataRouter([createCoinModuleSource(host), fallback]);

    const answer = await router.read("balance", utxo);

    expect(answer.sourceId).toBe("full-sync");
    expect(getApi).not.toHaveBeenCalled();
  });

  it("falls through to the next ranked source when the coin module implements no balance read", async () => {
    const { host } = hostOf({});
    host.getApi = async () => undefined;
    const router = createAccountDataRouter([createCoinModuleSource(host), fallback]);

    const answer = await router.read("balance", ethereum);

    expect(answer.sourceId).toBe("full-sync");
  });

  it("falls through to the next ranked source when the coin module returns tokens it cannot resolve", async () => {
    const { host } = hostOf(
      {
        "0xabc": [
          { value: 1n, asset: { type: "native" } },
          { value: 2n, asset: USDT_ASSET },
        ],
      },
      { getTokenId: undefined },
    );
    const router = createAccountDataRouter([createCoinModuleSource(host), fallback]);

    const answer = await router.read("balance", ethereum);

    expect(answer.sourceId).toBe("full-sync");
  });

  it("serves an account with no tokens when the coin module has no token resolver", async () => {
    const { host } = hostOf(
      { "0xabc": [{ value: 1n, asset: { type: "native" } }] },
      { getTokenId: undefined },
    );

    await expect(readBalance(host, ethereum)).resolves.toMatchObject({
      sourceId: "coin-module",
      data: [{ assetId: "ethereum", balance: "1" }],
    });
  });

  it("falls through to the next ranked source for a currency without coin module", async () => {
    const { host, getApi } = hostOf({});
    const router = createAccountDataRouter([createCoinModuleSource(host), fallback]);

    const answer = await router.read("balance", address("ethereum_sepolia", "0x1"));

    expect(answer.sourceId).toBe("full-sync");
    expect(getApi).not.toHaveBeenCalled();
  });

  describe("operations", () => {
    const pages = {
      "": {
        items: [
          nativeOperation("0x1", "2026-01-01T00:00:00.000Z"),
          nativeOperation("0x2", "2026-03-01T00:00:00.000Z"),
        ],
        next: "page-2",
      },
      "page-2": { items: [nativeOperation("0x3", "2025-12-01T00:00:00.000Z")], next: "page-3" },
      "page-3": { items: [nativeOperation("0x4", "2025-11-01T00:00:00.000Z")] },
    };

    it("reads the first page newest first, by the account's address and the query's limit", async () => {
      const { host, listOperations } = operationsHostOf(pages);
      const router = createAccountDataRouter([createCoinModuleSource(host)]);

      const { data, sourceId } = await router.read("operations", ethereum, {
        query: { limit: 2 },
      });

      expect(sourceId).toBe("coin-module");
      expect(listOperations).toHaveBeenCalledWith("0xabc", { cursor: undefined, limit: 2 });
      expect(idsOf(data)).toEqual(["ethereum-0x2-IN", "ethereum-0x1-IN"]);
      expect(data.nextCursor).toBe("page-2");
    });

    it("reads the next pages from the cursor each page handed out, until the list ends", async () => {
      const { host, listOperations } = operationsHostOf(pages);
      const router = createAccountDataRouter([createCoinModuleSource(host), fallback]);
      const sourceId = AccountDataSourceIdSchema.parse("coin-module");

      const second = await router.read("operations", ethereum, { cursor: "page-2", sourceId });
      const last = await router.read("operations", ethereum, {
        cursor: second.data.nextCursor,
        sourceId,
      });

      expect(listOperations.mock.calls.map(([, { cursor }]) => cursor)).toEqual([
        "page-2",
        "page-3",
      ]);
      expect(idsOf(second.data)).toEqual(["ethereum-0x3-IN"]);
      expect(idsOf(last.data)).toEqual(["ethereum-0x4-IN"]);
      expect(last.data.nextCursor).toBeUndefined();
    });

    it("fills a page its filters emptied from the next coin module pages", async () => {
      const nft = { ...nativeOperation("0xnft", "2026-02-01T00:00:00.000Z"), type: "NFT_IN" };
      const { host, listOperations } = operationsHostOf({
        "": { items: [nft], next: "page-2" },
        "page-2": { items: [nativeOperation("0x5", "2026-01-01T00:00:00.000Z")], next: "page-3" },
      });
      const router = createAccountDataRouter([createCoinModuleSource(host)]);

      const { data } = await router.read("operations", ethereum, { query: { limit: 1 } });

      expect(listOperations.mock.calls.map(([, { cursor }]) => cursor)).toEqual([
        undefined,
        "page-2",
      ]);
      expect(idsOf(data)).toEqual(["ethereum-0x5-IN"]);
      expect(data.nextCursor).toBe("page-3");
    });

    it("stops filling after a few coin module pages, handing the cursor on", async () => {
      const nft = { ...nativeOperation("0xnft", "2026-02-01T00:00:00.000Z"), type: "NFT_IN" };
      const { host, listOperations } = operationsHostOf({});
      listOperations.mockImplementation(async (_subject, { cursor }) => ({
        items: [nft],
        next: `${cursor ?? ""}+`,
      }));
      const router = createAccountDataRouter([createCoinModuleSource(host)]);

      const { data } = await router.read("operations", ethereum);

      expect(listOperations).toHaveBeenCalledTimes(MAX_PAGES_PER_READ);
      expect(data).toEqual({ operations: [], nextCursor: "+".repeat(MAX_PAGES_PER_READ) });
    });

    describe("filterAsset", () => {
      const usdtOperation = (hash: string, date: string): CoinModuleOperation => ({
        ...nativeOperation(hash, date),
        id: `${hash}-usdt-IN`,
        asset: USDT_ASSET,
      });
      const tokenHostOf = (tokenPages: Record<string, CoinModuleOperationsPage>) => {
        const { host, listOperations } = operationsHostOf(tokenPages);
        host.getOperationsApi = async () => ({
          listOperations,
          getTokenId: async asset =>
            "assetReference" in asset && asset.assetReference
              ? tokenIds[asset.assetReference]
              : undefined,
        });
        return { host, listOperations };
      };
      const filterUsdt = {
        query: { limit: 2, filterAsset: CryptoOrTokenCurrencyIdSchema.parse(USDT) },
      };

      it("keeps the token's rows, pointing at their transaction's native operation", async () => {
        const { host } = tokenHostOf({
          "": {
            items: [
              nativeOperation("0x1", "2026-02-01T00:00:00.000Z"),
              usdtOperation("0x1", "2026-02-01T00:00:00.000Z"),
              nativeOperation("0x2", "2026-01-01T00:00:00.000Z"),
              usdtOperation("0x3", "2025-12-01T00:00:00.000Z"),
            ],
          },
        });
        const router = createAccountDataRouter([createCoinModuleSource(host)]);

        const { data } = await router.read("operations", ethereum, filterUsdt);

        expect(data.operations).toEqual([
          expect.objectContaining({ id: `${USDT}-0x1-usdt-IN`, parentId: "ethereum-0x1-IN" }),
          expect.objectContaining({ id: `${USDT}-0x3-usdt-IN`, assetId: USDT }),
        ]);
        expect(data.nextCursor).toBeUndefined();
      });

      it("reads the next coin module pages until the token's rows fill the limit", async () => {
        const { host, listOperations } = tokenHostOf({
          "": {
            items: [
              nativeOperation("0x1", "2026-03-01T00:00:00.000Z"),
              usdtOperation("0x2", "2026-02-01T00:00:00.000Z"),
            ],
            next: "page-2",
          },
          "page-2": { items: [nativeOperation("0x3", "2026-01-15T00:00:00.000Z")], next: "page-3" },
          "page-3": { items: [usdtOperation("0x4", "2026-01-01T00:00:00.000Z")], next: "page-4" },
        });
        const router = createAccountDataRouter([createCoinModuleSource(host)]);

        const { data } = await router.read("operations", ethereum, filterUsdt);

        expect(listOperations).toHaveBeenCalledTimes(3);
        expect(idsOf(data)).toEqual([`${USDT}-0x2-usdt-IN`, `${USDT}-0x4-usdt-IN`]);
        expect(data.nextCursor).toBe("page-4");
      });

      it("keeps the native coin's rows when filtered on it", async () => {
        const { host } = tokenHostOf({
          "": {
            items: [
              nativeOperation("0x1", "2026-02-01T00:00:00.000Z"),
              usdtOperation("0x1", "2026-02-01T00:00:00.000Z"),
            ],
          },
        });
        const router = createAccountDataRouter([createCoinModuleSource(host)]);

        const { data } = await router.read("operations", ethereum, {
          query: { filterAsset: CryptoOrTokenCurrencyIdSchema.parse("ethereum") },
        });

        expect(idsOf(data)).toEqual(["ethereum-0x1-IN"]);
      });

      it("counts the fees row of a token-only transaction towards the native coin's limit", async () => {
        const tokenOnly = usdtOperation("0x5", "2026-02-01T00:00:00.000Z");
        const { host, listOperations } = tokenHostOf({
          "": {
            items: [{ ...tokenOnly, tx: { ...tokenOnly.tx, fees: 3n, feesPayer: "0xabc" } }],
            next: "page-2",
          },
        });
        const router = createAccountDataRouter([createCoinModuleSource(host)]);

        const { data } = await router.read("operations", ethereum, {
          query: { limit: 1, filterAsset: CryptoOrTokenCurrencyIdSchema.parse("ethereum") },
        });

        expect(listOperations).toHaveBeenCalledTimes(1);
        expect(idsOf(data)).toEqual(["ethereum-0x5-FEES"]);
        expect(data.nextCursor).toBe("page-2");
      });
    });

    it("ends the list on a cursor that does not advance", async () => {
      const { host, listOperations } = operationsHostOf({
        "page-2": { items: [], next: "page-2" },
      });
      const router = createAccountDataRouter([createCoinModuleSource(host)]);

      const { data } = await router.read("operations", ethereum, {
        cursor: "page-2",
        sourceId: AccountDataSourceIdSchema.parse("coin-module"),
      });

      expect(listOperations).toHaveBeenCalledTimes(1);
      expect(data).toEqual({ operations: [] });
    });

    it("answers an empty list for an account the coin module knows no operation of", async () => {
      const { host } = operationsHostOf({});

      await expect(
        createAccountDataRouter([createCoinModuleSource(host)]).read("operations", ethereum),
      ).resolves.toEqual({ data: { operations: [] }, sourceId: "coin-module" });
    });

    it("fails the page when the coin module does", async () => {
      const { host, listOperations } = operationsHostOf(pages);
      listOperations.mockRejectedValueOnce(new Error("explorer down"));

      await expect(
        createAccountDataRouter([createCoinModuleSource(host), fallback]).read(
          "operations",
          ethereum,
        ),
      ).rejects.toThrow("explorer down");
    });

    it("falls through to the next ranked source for a currency whose coin module does not page its operations", async () => {
      const { host, getOperationsApi } = operationsHostOf(pages, { paginates: false });
      const router = createAccountDataRouter([createCoinModuleSource(host), fallback]);

      const answer = await router.read("operations", ethereum);

      expect(answer.sourceId).toBe("full-sync");
      expect(getOperationsApi).not.toHaveBeenCalled();
    });

    it("falls through to the next ranked source when the coin module implements no operations read", async () => {
      const { host } = operationsHostOf(pages);
      host.getOperationsApi = async () => undefined;
      const router = createAccountDataRouter([createCoinModuleSource(host), fallback]);

      await expect(router.read("operations", ethereum)).resolves.toMatchObject({
        sourceId: "full-sync",
      });
    });
  });
});

describe("existence", () => {
  const target = { accountUUID: computeAccountUUID(ethereum), descriptor: ethereum };

  it("asks the coin module whether the address has any history", async () => {
    const exists = jest.fn(async (subject: string) => subject === "0xabc");
    const source = createCoinModuleSource({
      isCurrencySupported: () => true,
      getApi: async () => undefined,
      getExistenceApi: async () => ({ exists }),
    });
    await expect(source.read?.existence?.(target, undefined)).resolves.toEqual({ used: true });
    expect(exists).toHaveBeenCalledWith("0xabc");
  });

  it("does not ask the coin module once the read aborted while it loaded", async () => {
    const exists = jest.fn(async () => true);
    const controller = new AbortController();
    const source = createCoinModuleSource({
      isCurrencySupported: () => true,
      getApi: async () => undefined,
      getExistenceApi: async () => {
        controller.abort();
        return { exists };
      },
    });
    await expect(
      source.read?.existence?.({ ...target, signal: controller.signal }, undefined),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(exists).not.toHaveBeenCalled();
  });

  it("hands the account to the next source when the coin module has no exists", async () => {
    const fallback: AccountDataSource = {
      id: AccountDataSourceIdSchema.parse("full-sync"),
      supports: () => true,
      read: { existence: async () => ({ used: false }) },
    };
    const router = createAccountDataRouter([
      createCoinModuleSource({
        isCurrencySupported: () => true,
        getApi: async () => undefined,
        getExistenceApi: async () => undefined,
      }),
      fallback,
    ]);
    await expect(router.read("existence", ethereum)).resolves.toEqual({
      data: { used: false },
      sourceId: fallback.id,
    });
  });
});
