import BigNumber from "bignumber.js";
import { createAccountDataRouter } from "@domain/api-account-data";
import type { AccountStaking } from "@domain/entity-account-staking";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { createCoinModuleSource } from "@features/platform-account-source-coin-module";
import { buildTronStakes } from "@ledgerhq/coin-tron/logic/getStakes";
import { mockTronAccount } from "./accountData.mock";
import tronStaking from "./staking";
import tronCoinModuleStakes from "./coinModuleStakes";

const address = "TAddress";
const now = new Date();
const resources = mockTronAccount({
  votes: [
    { name: "sr1", address: "TSR1", voteCount: 3 },
    { name: "sr2", address: "TSR2", voteCount: 2 },
  ],
  frozen: { bandwidth: { amount: new BigNumber(7_000_000) }, energy: null },
  unFrozen: {
    bandwidth: [
      { amount: new BigNumber(2_000_000), expireTime: new Date(now.getTime() + 86_400_000) },
    ],
    energy: [{ amount: new BigNumber(1_000_000), expireTime: new Date(now.getTime() - 1000) }],
  },
  unwithdrawnReward: new BigNumber(43),
}).tronResources;

async function readCoinModuleStaking(): Promise<AccountStaking> {
  const { normalizeStake, rewardsAccountWide } = tronCoinModuleStakes;
  const stakes = buildTronStakes(address, resources, now);
  const source = createCoinModuleSource({
    isCurrencySupported: id => id === "tron",
    getApi: async () => undefined,
    getStakingApi: async () => ({
      getStakes: async () => ({ items: normalizeStake ? stakes.map(normalizeStake) : stakes }),
      rewardsAccountWide,
    }),
  });
  const descriptor = mockAddressAccountDescriptor({ network: "tron", key: address });
  const { data } = await createAccountDataRouter([source]).read("staking", descriptor);
  return data;
}

const principal = ({ positions }: AccountStaking) =>
  positions
    .map(({ state, validatorId, amount }) => ({ state, validatorId, amount }))
    .sort((a, b) => `${a.state}${a.validatorId}`.localeCompare(`${b.state}${b.validatorId}`));

const unlocks = ({ positions }: AccountStaking) =>
  positions.filter(({ state }) => state === "deactivating").map(({ unlockAt }) => unlockAt);

describe("tronCoinModuleStakes", () => {
  it("keeps the principal on each position, the reward riding the account", () => {
    const [vote] = buildTronStakes(address, resources, now);
    expect(vote.amount).toBeGreaterThan(vote.amountDeposited ?? 0n);
    expect(tronCoinModuleStakes.normalizeStake?.(vote)).toMatchObject({
      amount: vote.amountDeposited,
      amountRewarded: vote.amountRewarded,
    });
  });

  it("answers the same positions and reward as FullSync", async () => {
    const fullSync = tronStaking(mockTronAccount(resources));
    const coinModule = await readCoinModuleStaking();

    expect(principal(coinModule)).toEqual(principal(fullSync));
    expect(coinModule.rewards).toEqual(fullSync.rewards);
    expect(coinModule.rewards).toEqual([{ assetId: "tron", amount: "43" }]);
  });

  it("keeps the unlock date of a future unfreeze, as FullSync does", async () => {
    const fullSync = unlocks(tronStaking(mockTronAccount(resources)));
    const coinModule = unlocks(await readCoinModuleStaking());

    expect(coinModule).toEqual([new Date(now.getTime() + 86_400_000).toISOString()]);
    expect(coinModule).toEqual(fullSync);
  });
});
