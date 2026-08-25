import BigNumber from "bignumber.js";

jest.mock("../../api", () => ({
  fetchBlockHeight: jest.fn(),
  fetchBalance: jest.fn(),
  fetchTxns: jest.fn(),
}));

import * as api from "../../api";
import { ICPAccount, ICPNeuron, NeuronsData, NeuronState } from "../../types";
import { getAccountShape } from "./account";

const XPUB =
  "0484bf7562262bbd6940085748f3be6afa52ae317155181ece31b66351ccffa4b08cc43d63b2859d469fee15f31c9edb5324266e6fd0407e87382d60fc4511acd8";

const neuron: ICPNeuron = {
  id: 7n,
  accountIdentifier: "ab".repeat(32),
  state: NeuronState.Locked,
  dissolveDelaySeconds: 0n,
  ageSeconds: 0n,
  cachedNeuronStakeE8s: 0n,
  neuronFeesE8s: 0n,
  maturityE8sEquivalent: 0n,
  stakedMaturityE8sEquivalent: 0n,
  createdTimestampSeconds: 0n,
  hotKeys: [],
  followees: [],
  autoStakeMaturity: false,
};

const infoWith = (initialAccount: unknown) =>
  ({
    currency: { id: "internet_computer" },
    derivationMode: "",
    index: 0,
    rest: { publicKey: XPUB },
    initialAccount,
  }) as any;

describe("getAccountShape neuron persistence", () => {
  beforeEach(() => {
    (api.fetchBlockHeight as jest.Mock).mockResolvedValue(new BigNumber(100));
    (api.fetchBalance as jest.Mock).mockResolvedValue(new BigNumber(0));
    (api.fetchTxns as jest.Mock).mockResolvedValue([]);
  });

  it("applies the newest list_neurons snapshot from operation extra onto account.neurons", async () => {
    const listOp = {
      type: "OUT",
      date: new Date(1_720_000_000_000),
      recipients: [],
      extra: { neurons: [neuron] },
    };
    const shape = (await getAccountShape(
      infoWith({
        id: "x",
        blockHeight: 0,
        operations: [],
        pendingOperations: [listOp],
        neurons: NeuronsData.empty(),
      }),
      {} as any,
    )) as ICPAccount;

    expect(shape.neurons.fullNeurons).toEqual([neuron]);
    expect(shape.neurons.lastUpdatedMSecs).toBe(1_720_000_000_000);
  });

  it("carries the previous snapshot when no operation carries one", async () => {
    const shape = (await getAccountShape(
      infoWith({
        id: "x",
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        neurons: new NeuronsData([neuron], 5),
      }),
      {} as any,
    )) as ICPAccount;

    expect(shape.neurons.fullNeurons).toEqual([neuron]);
    expect(shape.neurons.lastUpdatedMSecs).toBe(5);
  });

  it("keeps the account's snapshot when an older operation still carries one", async () => {
    const staleOp = {
      type: "FEES",
      date: new Date(1_000),
      recipients: [],
      extra: { neurons: [] },
    };
    const shape = (await getAccountShape(
      infoWith({
        id: "x",
        blockHeight: 0,
        operations: [staleOp],
        pendingOperations: [],
        neurons: new NeuronsData([neuron], 2_000),
      }),
      {} as any,
    )) as ICPAccount;

    expect(shape.neurons.fullNeurons).toEqual([neuron]);
    expect(shape.neurons.lastUpdatedMSecs).toBe(2_000);
  });
});
