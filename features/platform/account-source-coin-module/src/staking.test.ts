import { createAccountDataRouter, type AccountDataSource } from "@domain/api-account-data";
import { AccountDataSourceIdSchema } from "@domain/entity-account-data";
import { NetworkIdSchema, type AccountDescriptor } from "@domain/entity-account-descriptor";
import type { Page, Stake } from "@ledgerhq/coin-module-framework/api/types";
import type { CoinModuleHost, CoinModuleStakingApi } from "./host";
import { createCoinModuleSource } from "./createCoinModuleSource";
import { MAX_STAKE_PAGES } from "./internals/toAccountStaking";

const cosmos: AccountDescriptor = {
  purpose: "account",
  version: "2",
  type: "address",
  network: NetworkIdSchema.parse("cosmos"),
  key: "cosmos1abc",
  path: "m/44h/118h/0h/0/0",
};

const stake = (overrides: Partial<Stake> = {}): Stake => ({
  uid: "cosmos1abc:cosmosvaloper1a",
  address: "cosmos1abc",
  delegate: "cosmosvaloper1a",
  state: "active",
  actions: ["undelegate", "redelegate", "claim_reward"],
  asset: { type: "native" },
  amount: 1000n,
  amountDeposited: 1000n,
  amountRewarded: 15n,
  ...overrides,
});

const hostOf = (
  pages: Record<string, Page<Stake>>,
  api: Partial<CoinModuleStakingApi> | null = {},
) => {
  const getStakes = jest.fn(
    async (_subject: string, cursor?: string) => pages[cursor ?? ""] ?? { items: [] },
  );
  const host: CoinModuleHost = {
    isCurrencySupported: id => id === "cosmos",
    getApi: async () => undefined,
    getStakingApi: async () => (api ? { getStakes, ...api } : undefined),
  };
  return { host, getStakes };
};

const fallback: AccountDataSource = {
  id: AccountDataSourceIdSchema.parse("full-sync"),
  supports: () => true,
  read: { staking: async () => ({ positions: [] }) },
};

const readStaking = (host: CoinModuleHost) =>
  createAccountDataRouter([createCoinModuleSource(host), fallback]).read("staking", cosmos);

describe("createCoinModuleSource staking", () => {
  it("maps each stake of the address to a position", async () => {
    const unlock = new Date("2026-12-01T00:00:00.000Z");
    const { host, getStakes } = hostOf({
      "": {
        items: [
          stake(),
          stake({
            uid: "u",
            state: "deactivating",
            stateUpdatedAt: unlock,
            actions: [],
            amount: 50n,
            amountDeposited: undefined,
            amountRewarded: undefined,
          }),
        ],
      },
    });

    const { data, sourceId } = await readStaking(host);

    expect(sourceId).toBe("coin-module");
    expect(getStakes).toHaveBeenCalledWith("cosmos1abc", undefined);
    expect(data.positions).toEqual([
      {
        id: "cosmos1abc:cosmosvaloper1a",
        assetId: "cosmos",
        validatorId: "cosmosvaloper1a",
        state: "active",
        amount: "1000",
        deposited: "1000",
        rewards: "15",
        actions: ["undelegate", "redelegate", "claim_reward"],
      },
      {
        id: "u",
        assetId: "cosmos",
        validatorId: "cosmosvaloper1a",
        state: "deactivating",
        amount: "50",
        unlockAt: "2026-12-01T00:00:00.000Z",
        actions: [],
      },
    ]);
  });

  it("walks every page", async () => {
    const { host, getStakes } = hostOf({
      "": { items: [stake({ uid: "a" })], next: "p2" },
      p2: { items: [], next: "p3" },
      p3: { items: [stake({ uid: "b" })] },
    });

    const { data } = await readStaking(host);

    expect(data.positions.map(({ id }) => id)).toEqual(["a", "b"]);
    expect(getStakes).toHaveBeenCalledTimes(3);
  });

  it("falls through on a cursor that does not advance, and past the page budget", async () => {
    const stuck = hostOf({
      "": { items: [stake({ uid: "a" })], next: "p" },
      p: { items: [stake({ uid: "a" })], next: "p" },
    });
    await expect(readStaking(stuck.host)).resolves.toMatchObject({ sourceId: "full-sync" });
    expect(stuck.getStakes).toHaveBeenCalledTimes(2);

    const endless = hostOf({});
    endless.getStakes.mockImplementation(async (_subject, cursor) => ({
      items: [],
      next: `${cursor ?? ""}+`,
    }));
    await expect(readStaking(endless.host)).resolves.toMatchObject({ sourceId: "full-sync" });
    expect(endless.getStakes).toHaveBeenCalledTimes(MAX_STAKE_PAGES);
  });

  it("resolves a token stake, and leaves out one the host does not list", async () => {
    const listed = { type: "ibc", assetReference: "listed" };
    const unknown = { type: "ibc", assetReference: "unknown" };
    const { host } = hostOf(
      { "": { items: [stake({ uid: "t", asset: listed }), stake({ uid: "x", asset: unknown })] } },
      {
        getTokenId: async asset =>
          "assetReference" in asset && asset.assetReference === "listed"
            ? "cosmos/ibc/listed"
            : undefined,
      },
    );

    const { data } = await readStaking(host);

    expect(data.positions).toEqual([
      expect.objectContaining({ id: "t", assetId: "cosmos/ibc/listed" }),
    ]);
  });

  it("sums the rewards account-wide when the chain pays them so, leaving out an emptied position", async () => {
    const { host } = hostOf(
      {
        "": {
          items: [
            stake({ uid: "a", amount: 1000n, amountRewarded: 15n }),
            stake({ uid: "b", amount: 0n, amountDeposited: 0n, amountRewarded: 5n }),
          ],
        },
      },
      { rewardsAccountWide: true },
    );

    const { data } = await readStaking(host);

    expect(data.positions).toEqual([
      expect.objectContaining({ id: "a", amount: "1000", rewards: undefined }),
    ]);
    expect(data.rewards).toEqual([{ assetId: "cosmos", amount: "20" }]);
  });

  it("falls back to the next source when the coin module has no getStakes", async () => {
    const { host } = hostOf({}, null);

    await expect(readStaking(host)).resolves.toMatchObject({ sourceId: "full-sync" });
  });
});
