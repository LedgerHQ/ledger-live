import { createAccountDataRouter, type AccountDataSource } from "@domain/api-account-data";
import { AccountDataSourceIdSchema } from "@domain/entity-account-data";
import { computeAccountUUID, type AccountDescriptor } from "@domain/entity-account-descriptor";
import type { CoinModuleBalance, CoinModuleBalanceApi, CoinModuleHost } from "./host";
import { createCoinModuleSource } from "./createCoinModuleSource";

const XPUB =
  "xpub6BosfCnifzxcFwrSzQiqu2DBVTshkCXacvNsWGYJVVhhawA7d4R5WSE1S2G4UrqdKFNvJx3bR7MNfYTc4FXnAFzBVNMcJYHx5ENKnG9WNzh";

const utxo: AccountDescriptor = {
  purpose: "account",
  version: "2",
  type: "utxo",
  network: "bitcoin",
  xpub: XPUB,
  path: "m/84h/0h/0h",
};

const address = (network: string, value: string): AccountDescriptor => ({
  purpose: "account",
  version: "2",
  type: "address",
  network,
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
  balances: Record<string, CoinModuleBalance[]>,
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
  read: { balance: async () => [] },
};

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
      const entries: CoinModuleBalance[] = [
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

    it("reads the accounts of one tick in one batch, loading each coin module once", async () => {
      const { host, getBalance, getApi } = hostOf({
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
      expect(getApi.mock.calls.map(([currencyId]) => currencyId).sort()).toEqual([
        "bitcoin",
        "ethereum",
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

  describe("balance batch", () => {
    it("keeps at most 4 coin module calls in flight across batch calls", async () => {
      const { host, getBalance } = hostOf({});
      let inFlight = 0;
      let peak = 0;
      getBalance.mockImplementation(async () => {
        peak = Math.max(peak, ++inFlight);
        for (let tick = 0; tick < 5; tick++) await Promise.resolve();
        inFlight--;
        return [];
      });
      const router = createAccountDataRouter([createCoinModuleSource(host)]);

      await Promise.all(
        Array.from({ length: 25 }, (_, n) => router.read("balance", address("ethereum", `0x${n}`))),
      );

      expect(getBalance).toHaveBeenCalledTimes(25);
      expect(peak).toBe(4);
    });

    it("answers one settled result per account, in order, a failing account failing alone", async () => {
      const { host, getBalance } = hostOf({});
      getBalance.mockImplementation(async subject => {
        if (subject === "0x2") throw new Error("explorer down");
        return subject === "0x1"
          ? [{ value: 1n, asset: { type: "native" } }]
          : [{ value: 3n, asset: { type: "native" } }];
      });

      const answers = await createCoinModuleSource(host).readBatch?.balance?.(
        [address("ethereum", "0x1"), address("ethereum", "0x2"), utxo].map(targetOf),
        undefined,
      );

      expect(answers).toEqual([
        {
          status: "fulfilled",
          value: [{ assetId: "ethereum", balance: "1", spendableBalance: "1" }],
        },
        { status: "rejected", reason: new Error("explorer down") },
        {
          status: "fulfilled",
          value: [{ assetId: "bitcoin", balance: "3", spendableBalance: "3" }],
        },
      ]);
    });

    it("fails only the accounts of a currency whose coin module does not load", async () => {
      const { host, getApi } = hostOf({ [XPUB]: [{ value: 3n, asset: { type: "native" } }] });
      const loadApi = getApi.getMockImplementation()!;
      getApi.mockImplementation(async currencyId => {
        if (currencyId === "ethereum") throw new Error("chunk failed");
        return loadApi(currencyId);
      });

      const answers = await createCoinModuleSource(host).readBatch?.balance?.(
        [ethereum, utxo].map(targetOf),
        undefined,
      );

      expect(answers?.map(({ status }) => status)).toEqual(["rejected", "fulfilled"]);
    });
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
});
