import { SECONDS_IN_YEAR } from "@ledgerhq/live-common/families/internet_computer/consts";
import {
  NeuronState,
  type ICPAccount,
  type InternetComputerOperation,
  type Transaction,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { applyNeuronOperation } from "../common";
import { makeICPAccount, makeNeuron } from "./testUtils";

const NEURON_ADDRESS = "neuron-account-identifier";

const makeOperation = (
  overrides: Partial<InternetComputerOperation> = {},
): InternetComputerOperation =>
  ({
    id: "op-1",
    hash: "hash-1",
    accountId: "account-1",
    type: "NONE",
    date: new Date("2026-08-12T10:00:00Z"),
    recipients: [],
    senders: [],
    blockHeight: 1,
    extra: {},
    ...overrides,
  }) as unknown as InternetComputerOperation;

// updateAccountWithUpdater is a plain action creator, so the updater it carries can be applied
// directly rather than through a store.
const runUpdater = (account: ICPAccount, operation: InternetComputerOperation): ICPAccount => {
  const dispatch = jest.fn();
  applyNeuronOperation(dispatch, account, operation);
  const [action] = dispatch.mock.calls[0];
  return action.payload.updater(account) as ICPAccount;
};

describe("applyNeuronOperation", () => {
  it("keeps a governance operation out of history while still applying its snapshot", () => {
    const account = makeICPAccount({ neurons: [] });
    // Named for this account, so an empty pendingOperations can only mean the type was honoured.
    const operation = makeOperation({
      accountId: account.id,
      extra: { neurons: [makeNeuron({ id: 9n })] },
    });

    const updated = runUpdater(account, operation);

    expect(updated.pendingOperations).toHaveLength(0);
    expect(updated.neurons.fullNeurons.map(n => n.id)).toEqual([9n]);
  });

  it("still lists a staking transfer, which is a real ledger transaction", () => {
    const account = makeICPAccount({ neurons: [] });
    const operation = makeOperation({
      type: "STAKE_NEURON",
      accountId: account.id,
      extra: {},
    });

    const updated = runUpdater(account, operation);

    expect(updated.pendingOperations.map(op => op.type)).toEqual(["STAKE_NEURON"]);
  });

  it("leaves the neurons alone when the operation carries no snapshot", () => {
    const account = makeICPAccount({ neurons: [makeNeuron({ id: 1n })] });

    const updated = runUpdater(account, makeOperation());

    expect(updated.neurons.fullNeurons.map(n => n.id)).toEqual([1n]);
  });

  it("replaces the snapshot and stamps it with the operation's date", () => {
    const account = makeICPAccount({ neurons: [makeNeuron({ id: 1n })] });
    const operation = makeOperation({
      extra: { neurons: [makeNeuron({ id: 2n }), makeNeuron({ id: 3n })] },
    });

    const updated = runUpdater(account, operation);

    expect(updated.neurons.fullNeurons.map(n => n.id)).toEqual([2n, 3n]);
    expect(updated.neurons.lastUpdatedMSecs).toBe(operation.date.getTime());
  });

  it("targets the account the operation belongs to", () => {
    const account = makeICPAccount();
    const dispatch = jest.fn();

    applyNeuronOperation(dispatch, account, makeOperation());

    expect(dispatch.mock.calls[0][0].payload.accountId).toBe(account.id);
  });

  // Only once the neuron addresses are known can a transfer to one be told apart from a plain send.
  it("retypes a memo'd transfer to a neuron subaccount as a stake", () => {
    const account = makeICPAccount();
    account.operations = [
      makeOperation({ type: "OUT", recipients: [NEURON_ADDRESS], extra: { memo: "12345" } }),
    ];
    const operation = makeOperation({
      extra: { neurons: [makeNeuron({ accountIdentifier: NEURON_ADDRESS })] },
    });

    const updated = runUpdater(account, operation);

    expect(updated.operations[0].type).toBe("STAKE_NEURON");
  });

  it("retypes an unmemo'd transfer to a neuron subaccount as a top-up", () => {
    const account = makeICPAccount();
    account.operations = [makeOperation({ type: "OUT", recipients: [NEURON_ADDRESS], extra: {} })];
    const operation = makeOperation({
      extra: { neurons: [makeNeuron({ accountIdentifier: NEURON_ADDRESS })] },
    });

    const updated = runUpdater(account, operation);

    expect(updated.operations[0].type).toBe("TOP_UP_NEURON");
  });

  it("leaves transfers to anywhere else alone", () => {
    const account = makeICPAccount();
    account.operations = [makeOperation({ type: "OUT", recipients: ["someone-else"], extra: {} })];
    const operation = makeOperation({
      extra: { neurons: [makeNeuron({ accountIdentifier: NEURON_ADDRESS })] },
    });

    const updated = runUpdater(account, operation);

    expect(updated.operations[0].type).toBe("OUT");
  });
});

describe("applyNeuronOperation replaying an accepted command", () => {
  const DELAY = BigInt(SECONDS_IN_YEAR);

  const lockedNeuron = () =>
    makeNeuron({
      id: 7n,
      state: NeuronState.Locked,
      dissolveDelaySeconds: DELAY,
      dissolveState: { DissolveDelaySeconds: DELAY },
    });

  const replay = (
    account: ICPAccount,
    transaction: Record<string, unknown>,
    operation = makeOperation(),
  ): ICPAccount => {
    const dispatch = jest.fn();
    applyNeuronOperation(dispatch, account, operation, transaction as unknown as Transaction);
    const [action] = dispatch.mock.calls[0];
    return action.payload.updater(account) as ICPAccount;
  };

  // A manage_neuron reply carries no snapshot, and reading one back costs another device signature.
  // Without the replay the details screen kept showing the state the action was meant to change.
  it("shows the neuron dissolving without waiting for a refresh", () => {
    const account = makeICPAccount({ neurons: [lockedNeuron()] });

    const updated = replay(account, { type: "start_dissolving", neuronId: "7" });

    expect(updated.neurons.fullNeurons[0].state).toBe(NeuronState.Dissolving);
  });

  // The neuron is only as fresh as the last real canister read, so "Last synced" must not move.
  it("leaves the last-synced stamp where it was", () => {
    const lastUpdatedMSecs = 1_700_000_000_000;
    const account = makeICPAccount({ neurons: [lockedNeuron()], lastUpdatedMSecs });

    const updated = replay(account, { type: "start_dissolving", neuronId: "7" });

    expect(updated.neurons.lastUpdatedMSecs).toBe(lastUpdatedMSecs);
  });

  it("leaves the snapshot untouched for a command whose result only the canister knows", () => {
    const account = makeICPAccount({ neurons: [lockedNeuron()] });

    const updated = replay(account, { type: "disburse", neuronId: "7" });

    expect(updated.neurons.fullNeurons[0].state).toBe(NeuronState.Locked);
  });

  /*
   * stake_maturity states its own result, and this is the one place that carries it from the
   * operation into the replay. Drop the argument and the arm silently declines instead — the neuron
   * keeps its pre-command maturity and nothing fails, which is why it is pinned here and not only in
   * the coin module.
   */
  it("moves the maturity a stake_maturity command reported", () => {
    const account = makeICPAccount({
      neurons: [
        makeNeuron({
          id: 7n,
          maturityE8sEquivalent: 400_000_000n,
          stakedMaturityE8sEquivalent: 0n,
        }),
      ],
    });
    const operation = makeOperation({
      extra: { outcome: { maturityE8s: "200000000", stakedMaturityE8s: "200000000" } },
    });

    const updated = replay(
      account,
      { type: "stake_maturity", neuronId: "7", percentageToStake: 50 },
      operation,
    );

    expect(updated.neurons.fullNeurons[0].maturityE8sEquivalent).toBe(200_000_000n);
    expect(updated.neurons.fullNeurons[0].stakedMaturityE8sEquivalent).toBe(200_000_000n);
  });

  it("leaves the maturity alone when the command reported nothing", () => {
    const account = makeICPAccount({
      neurons: [makeNeuron({ id: 7n, maturityE8sEquivalent: 400_000_000n })],
    });

    const updated = replay(account, { type: "stake_maturity", neuronId: "7" });

    expect(updated.neurons.fullNeurons[0].maturityE8sEquivalent).toBe(400_000_000n);
  });

  /*
   * `ICPAccount.neurons` is typed required but only a sync or a deserialize populates it, so a
   * freshly added account has none — and creating a neuron is exactly what such an account does
   * first. Every stake broadcast reaches the replay, since only list_neurons carries a snapshot.
   */
  it("survives an account that has never been synced", () => {
    const account = makeICPAccount();
    delete (account as Partial<ICPAccount>).neurons;

    expect(() => replay(account, { type: "create_neuron" })).not.toThrow();
  });

  it("leaves the snapshot untouched when no transaction is supplied", () => {
    const account = makeICPAccount({ neurons: [lockedNeuron()] });

    const updated = runUpdater(account, makeOperation());

    expect(updated.neurons.fullNeurons[0].state).toBe(NeuronState.Locked);
  });
});
