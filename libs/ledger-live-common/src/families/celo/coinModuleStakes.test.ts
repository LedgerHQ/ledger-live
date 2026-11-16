import type { Stake } from "@ledgerhq/coin-module-framework/api/types";
import { createAccountDataRouter } from "@domain/api-account-data";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { createCoinModuleSource } from "@features/platform-account-source-coin-module";
import celoCoinModuleStakes from "./coinModuleStakes";

const address = "0xcelo";
const availableAt = 1_900_000_000;

const withdrawal = (overrides: Partial<Stake>): Stake => ({
  uid: `${address}:withdrawal:0`,
  address,
  state: "deactivating",
  actions: [],
  asset: { type: "native" },
  amount: 5n,
  details: { index: 0, availableAt },
  ...overrides,
});

const normalize = (value: Stake) => celoCoinModuleStakes.normalizeStake?.(value) ?? value;

async function readUnlocks(stakes: Stake[]) {
  const source = createCoinModuleSource({
    isCurrencySupported: id => id === "celo",
    getApi: async () => undefined,
    getStakingApi: async () => ({
      getStakes: async () => ({ items: stakes.map(normalize) }),
    }),
  });
  const descriptor = mockAddressAccountDescriptor({ network: "celo", key: address });
  const { data } = await createAccountDataRouter([source]).read("staking", descriptor);
  return data.positions.map(({ state, unlockAt }) => ({ state, unlockAt }));
}

describe("celoCoinModuleStakes", () => {
  it("answers a pending withdrawal's expiry as its unlock date", async () => {
    expect(await readUnlocks([withdrawal({})])).toEqual([
      { state: "deactivating", unlockAt: new Date(availableAt * 1000).toISOString() },
    ]);
  });

  it("leaves a matured withdrawal and a stake without expiry", () => {
    const matured = withdrawal({ state: "withdrawable", actions: ["withdraw"] });
    expect(normalize(matured)).toBe(matured);
    const vote = withdrawal({ state: "active", details: {} });
    expect(normalize(vote)).toBe(vote);
  });
});
