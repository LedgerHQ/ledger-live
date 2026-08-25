import type {
  ICPAccount,
  InternetComputerOperation,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { applyNeuronOperation, onStakeConfirmed } from "../common";
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

// The action is a redux thunk-free plain action, so the updater it carries can be applied directly.
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

    expect(updated.neurons.fullNeurons).toHaveLength(1);
    expect(updated.neurons.fullNeurons[0].id).toBe(1n);
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

  // Only once the neuron addresses are known can a transfer to one be told apart from a plain send.
  it("retypes a memo'd transfer to a neuron subaccount as a stake", () => {
    const account = makeICPAccount({ neurons: [] });
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
    const account = makeICPAccount({ neurons: [] });
    account.operations = [makeOperation({ type: "OUT", recipients: [NEURON_ADDRESS], extra: {} })];
    const operation = makeOperation({
      extra: { neurons: [makeNeuron({ accountIdentifier: NEURON_ADDRESS })] },
    });

    const updated = runUpdater(account, operation);

    expect(updated.operations[0].type).toBe("TOP_UP_NEURON");
  });

  it("leaves transfers to anywhere else alone", () => {
    const account = makeICPAccount({ neurons: [] });
    account.operations = [makeOperation({ type: "OUT", recipients: ["someone-else"], extra: {} })];
    const operation = makeOperation({
      extra: { neurons: [makeNeuron({ accountIdentifier: NEURON_ADDRESS })] },
    });

    const updated = runUpdater(account, operation);

    expect(updated.operations[0].type).toBe("OUT");
  });
});

describe("onStakeConfirmed", () => {
  it("files the staking transfer before reopening the neuron list", () => {
    const account = makeICPAccount({ neurons: [] });
    const operation = {
      id: "op-1",
      hash: "hash-1",
      accountId: account.id,
      type: "STAKE_NEURON",
      date: new Date("2026-08-12T10:00:00Z"),
      recipients: [],
      senders: [],
      blockHeight: 1,
      extra: { createdNeuronId: "42" },
    } as unknown as InternetComputerOperation;
    const dispatch = jest.fn();

    onStakeConfirmed(dispatch, account)(operation);

    const [update, open] = dispatch.mock.calls.map(([action]) => action);
    expect((update.payload.updater(account) as ICPAccount).pendingOperations).toHaveLength(1);
    expect(open.payload).toMatchObject({ name: "MODAL_ICP_LIST_NEURONS" });
  });
});
