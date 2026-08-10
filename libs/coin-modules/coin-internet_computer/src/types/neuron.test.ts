import { ICPNeuron, NeuronsData, NeuronState } from "./neuron";

const neuron: ICPNeuron = {
  id: 123n,
  accountIdentifier: "ab".repeat(32),
  state: NeuronState.Locked,
  dissolveDelaySeconds: 63_115_200n,
  ageSeconds: 126_230_400n,
  cachedNeuronStakeE8s: 300_000_000n,
  neuronFeesE8s: 0n,
  maturityE8sEquivalent: 5n,
  stakedMaturityE8sEquivalent: 7n,
  createdTimestampSeconds: 1_600_000_000n,
  dissolveState: { DissolveDelaySeconds: 63_115_200n },
  controller: "2vxsx-fae",
  hotKeys: ["2vxsx-fae"],
  followees: [{ topic: 4, followeeIds: [999n] }],
  autoStakeMaturity: true,
};

describe("NeuronsData", () => {
  it("empty() has no neurons and a zero timestamp", () => {
    const empty = NeuronsData.empty();
    expect(empty.fullNeurons).toEqual([]);
    expect(empty.lastUpdatedMSecs).toBe(0);
  });

  it("serialize → deserialize round-trips, preserving bigint fields", () => {
    const data = new NeuronsData([neuron], 1_720_000_000_000);
    const restored = NeuronsData.deserialize(data.serialize());

    expect(restored.lastUpdatedMSecs).toBe(1_720_000_000_000);
    expect(restored.fullNeurons).toHaveLength(1);
    expect(restored.fullNeurons[0]).toEqual(neuron);
    expect(typeof restored.fullNeurons[0].cachedNeuronStakeE8s).toBe("bigint");
    expect(restored.fullNeurons[0].dissolveState).toEqual({ DissolveDelaySeconds: 63_115_200n });
  });

  it("deserialize tolerates an empty snapshot", () => {
    const restored = NeuronsData.deserialize({ neurons: "", lastUpdated: 0 });
    expect(restored.fullNeurons).toEqual([]);
  });

  it("deserialize falls back to an empty snapshot on corrupt neuron data", () => {
    const restored = NeuronsData.deserialize({ neurons: "{ not valid json", lastUpdated: 42 });
    expect(restored.fullNeurons).toEqual([]);
    expect(restored.lastUpdatedMSecs).toBe(42);
  });

  it("deserialize rejects a structurally wrong snapshot (non-array neurons, non-finite timestamp)", () => {
    const restored = NeuronsData.deserialize({
      neurons: '{"not":"an array"}',
      lastUpdated: NaN,
    });
    expect(restored.fullNeurons).toEqual([]);
    expect(restored.lastUpdatedMSecs).toBe(0);
  });
});
