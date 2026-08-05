import type { Account, AccountRaw } from "@ledgerhq/types-live";
import { ICPAccount, ICPAccountRaw, ICPNeuron, NeuronsData, NeuronState } from "../types";
import { assignFromAccountRaw, assignToAccountRaw } from "./serialization";

const neuron: ICPNeuron = {
  id: 7n,
  accountIdentifier: "ab".repeat(32),
  state: NeuronState.Locked,
  dissolveDelaySeconds: 63_115_200n,
  ageSeconds: 0n,
  cachedNeuronStakeE8s: 500_000_000n,
  neuronFeesE8s: 0n,
  maturityE8sEquivalent: 0n,
  stakedMaturityE8sEquivalent: 0n,
  createdTimestampSeconds: 0n,
  dissolveState: { DissolveDelaySeconds: 63_115_200n },
  hotKeys: [],
  followees: [],
  autoStakeMaturity: false,
};

describe("account neuron (de)serialization", () => {
  it("serializes neurons to raw and restores them, preserving bigints", () => {
    const account = { neurons: new NeuronsData([neuron], 1_720_000_000_000) } as ICPAccount;
    const raw = {} as AccountRaw;

    assignToAccountRaw(account, raw);
    expect((raw as ICPAccountRaw).neuronsData?.lastUpdated).toBe(1_720_000_000_000);

    const restored = {} as ICPAccount;
    assignFromAccountRaw(raw, restored);
    expect(restored.neurons.fullNeurons).toEqual([neuron]);
    expect(restored.neurons.lastUpdatedMSecs).toBe(1_720_000_000_000);
  });

  it("restores an empty portfolio when the raw account carries no neuron data", () => {
    const restored = {} as ICPAccount;
    assignFromAccountRaw({} as AccountRaw, restored);
    expect(restored.neurons.fullNeurons).toEqual([]);
  });

  it("skips serialization for an account without neurons", () => {
    const raw = {} as AccountRaw;
    assignToAccountRaw({} as Account, raw);
    expect((raw as ICPAccountRaw).neuronsData).toBeUndefined();
  });
});
