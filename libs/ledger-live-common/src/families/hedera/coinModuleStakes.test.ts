import type { Stake } from "@ledgerhq/coin-module-framework/api/types";
import { createAccountDataRouter } from "@domain/api-account-data";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { selectNetworkValidator } from "@domain/entity-network-validators";
import {
  createCoinModuleSource,
  createCoinModuleValidatorsSource,
} from "@features/platform-account-source-coin-module";
import hederaCoinModuleStakes from "./coinModuleStakes";

const address = "0.0.1234";
const balance = 5_000_000_000n;
const pendingReward = 100_000_000n;

const getStakesOutput: Stake = {
  uid: address,
  address,
  asset: { type: "native" },
  state: "active",
  amount: balance + pendingReward,
  amountDeposited: balance,
  amountRewarded: pendingReward,
  actions: [],
  details: { stakedNodeId: 3, overstaked: false },
  delegate: "0.0.7",
};

const getValidatorsOutput = { items: [{ id: "3", address: "0.0.7", name: "Node 3" }] };

const normalize = (value: Stake) => hederaCoinModuleStakes.normalizeStake?.(value) ?? value;

const descriptor = mockAddressAccountDescriptor({ network: "hedera", key: address });

async function readPositions(stakes: Stake[]) {
  const source = createCoinModuleSource({
    isCurrencySupported: id => id === "hedera",
    getApi: async () => undefined,
    getStakingApi: async () => ({
      getStakes: async () => ({ items: stakes.map(normalize) }),
    }),
  });
  const { data } = await createAccountDataRouter([source]).read("staking", descriptor);
  return data.positions;
}

describe("hederaCoinModuleStakes", () => {
  it("stakes the balance and keeps the pending reward apart", async () => {
    expect(await readPositions([getStakesOutput])).toEqual([
      expect.objectContaining({
        amount: balance.toString(),
        rewards: pendingReward.toString(),
      }),
    ]);
  });

  it("refers to the staked node by the id the network validators list it under", async () => {
    const [position] = await readPositions([getStakesOutput]);
    const validators = await createCoinModuleValidatorsSource({
      isCurrencySupported: id => id === "hedera",
      getValidatorsApi: async () => ({ getValidators: async () => getValidatorsOutput }),
      isLedgerValidator: () => false,
    }).read(descriptor.network, { signal: new AbortController().signal });
    const state = { networkValidators: { [descriptor.network]: { validators } } };

    expect(position.validatorId).toBe("3");
    expect(selectNetworkValidator(state, descriptor.network, "3")).toMatchObject({
      id: "3",
      address: "0.0.7",
    });
  });

  it("leaves an account staked to no node without a validator", async () => {
    const { delegate: _delegate, ...undelegated } = getStakesOutput;
    const [position] = await readPositions([
      { ...undelegated, state: "inactive", details: { stakedNodeId: -1, overstaked: null } },
    ]);
    expect(position.validatorId).toBeUndefined();
  });
});
