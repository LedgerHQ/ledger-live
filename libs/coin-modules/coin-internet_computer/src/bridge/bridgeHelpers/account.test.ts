import BigNumber from "bignumber.js";

jest.mock("../../api", () => ({
  fetchBlockHeight: jest.fn(),
  fetchBalance: jest.fn(),
  fetchTxns: jest.fn(),
}));

import * as api from "../../api";
import { ICPAccount, ICPNeuron, NeuronsData, NeuronState } from "../../types";
import { getAccountShape, postSync } from "./account";

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

describe("getAccountShape operation count", () => {
  beforeEach(() => {
    (api.fetchBlockHeight as jest.Mock).mockResolvedValue(new BigNumber(100));
    (api.fetchBalance as jest.Mock).mockResolvedValue(new BigNumber(0));
    (api.fetchTxns as jest.Mock).mockResolvedValue([]);
  });

  /*
   * The index canister is queried from the current ledger tip every sync, so it hands back the
   * newest page again each time. Adding that page to the stored count made the figure climb without
   * bound — QA's export read 32 against 18 operations. Omitting it lets the framework count the
   * merged list, which is the only place the real total is known.
   */
  it("leaves the count to the framework rather than adding the refetched page", async () => {
    const shape = await getAccountShape(
      infoWith({ id: "account-1", blockHeight: 0, operations: [{}, {}, {}], neurons: undefined }),
      {} as any,
    );

    expect(shape).not.toHaveProperty("operationsCount");
  });
});

describe("postSync", () => {
  const op = (overrides: Record<string, unknown>) =>
    ({ accountId: "a", senders: [], recipients: [], extra: {}, ...overrides }) as any;

  const account = (operations: unknown[]) =>
    ({ operations, operationsCount: operations.length }) as unknown as ICPAccount;

  it("returns the very same object when there is nothing to collapse", () => {
    const synced = account([op({ id: "a-h1-OUT", hash: "h1", type: "OUT" })]);

    expect(postSync({} as ICPAccount, synced)).toBe(synced);
  });

  // The stale copy lives in the stored list, which getAccountShape never sees — only the merged
  // result does, so this pass is also what heals an account that already holds duplicates.
  it("drops a send the merge kept beside its retyped self", () => {
    const synced = account([
      op({ id: "a-h1-STAKE_NEURON", hash: "h1", type: "STAKE_NEURON" }),
      op({ id: "a-h1-OUT", hash: "h1", type: "OUT" }),
    ]);

    const result = postSync({} as ICPAccount, synced);

    expect(result.operations.map(o => o.id)).toEqual(["a-h1-STAKE_NEURON"]);
  });

  it("brings the count back in step with what it kept", () => {
    const synced = account([
      op({ id: "a-h1-TOP_UP_NEURON", hash: "h1", type: "TOP_UP_NEURON" }),
      op({ id: "a-h1-OUT", hash: "h1", type: "OUT" }),
      op({ id: "a-h2-IN", hash: "h2", type: "IN" }),
    ]);

    expect(postSync({} as ICPAccount, synced).operationsCount).toBe(2);
  });
});
