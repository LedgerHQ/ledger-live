import { Principal } from "@dfinity/principal";
import BigNumber from "bignumber.js";
import { ICPNeuron, ICPTransactionType, InternetComputerOperation, Transaction } from "../types";
import { derivePrincipalFromPubkey } from "./crypto";
import {
  createReadStateRequest,
  createUnsignedListNeuronsTransaction,
  createUnsignedNeuronCommandTransaction,
  getNeuronStakeSubAccountIdentifier,
  recoverStakeMemo,
} from "./buildNeuronTransaction";

// Valid raw secp256k1 public key (from crypto.test.ts).
const XPUB =
  "0484bf7562262bbd6940085748f3be6afa52ae317155181ece31b66351ccffa4b08cc43d63b2859d469fee15f31c9edb5324266e6fd0407e87382d60fc4511acd8";
const HOTKEY = Principal.anonymous().toText();

const tx = (over: Partial<Transaction>): Transaction =>
  ({
    family: "internet_computer",
    type: "start_dissolving",
    amount: new BigNumber(0),
    fees: new BigNumber(10000),
    recipient: "",
    useAllAmount: false,
    neuronId: "123",
    ...over,
  }) as unknown as Transaction;

// One representative transaction per governance op, each exercising its command-specific fields.
const cases: Array<[ICPTransactionType, Partial<Transaction>]> = [
  ["start_dissolving", {}],
  ["stop_dissolving", {}],
  ["increase_dissolve_delay", { additionalDissolveDelay: "604800" }],
  ["set_dissolve_delay", { dissolveDelay: "63115200" }],
  ["add_hot_key", { hotKeyToAdd: HOTKEY }],
  ["remove_hot_key", { hotKeyToRemove: HOTKEY }],
  ["auto_stake_maturity", { autoStakeMaturity: true }],
  ["disburse", {}],
  ["spawn_neuron", { percentageToSpawn: "100" }],
  ["stake_maturity", { percentageToStake: "50" }],
  ["split_neuron", { amount: new BigNumber(200_000_000) }],
  ["follow", { followTopic: "Governance", followeesIds: ["111", "222"] }],
  ["refresh_voting_power", {}],
];

describe("createUnsignedNeuronCommandTransaction", () => {
  // IDL.encode validates each command against the vendored governance interface — a wrong candid
  // shape throws here, so a clean encode is the structural check.
  it.each(cases)("encodes the %s command against the governance IDL", (type, over) => {
    const unsigned = createUnsignedNeuronCommandTransaction(tx({ type, ...over }), XPUB);
    expect(unsigned.method_name).toBe("manage_neuron");
    expect(unsigned.arg.byteLength).toBeGreaterThan(0);
  });
});

describe("createUnsignedNeuronCommandTransaction guards", () => {
  it("throws when a neuron command has no neuronId", () => {
    const noNeuronId = {
      family: "internet_computer",
      type: "start_dissolving",
      amount: new BigNumber(0),
      fees: new BigNumber(10000),
      recipient: "",
      useAllAmount: false,
    } as unknown as Transaction;
    expect(() => createUnsignedNeuronCommandTransaction(noNeuronId, XPUB)).toThrow(/neuronId/);
  });

  it("throws when increase_dissolve_delay has no positive additional delay", () => {
    expect(() =>
      createUnsignedNeuronCommandTransaction(tx({ type: "increase_dissolve_delay" }), XPUB),
    ).toThrow(/additionalDissolveDelay/);
  });

  it("throws when set_dissolve_delay has a missing or non-integer dissolveDelay", () => {
    expect(() =>
      createUnsignedNeuronCommandTransaction(tx({ type: "set_dissolve_delay" }), XPUB),
    ).toThrow(/dissolveDelay/);
    expect(() =>
      createUnsignedNeuronCommandTransaction(
        tx({ type: "set_dissolve_delay", dissolveDelay: "12.5" }),
        XPUB,
      ),
    ).toThrow(/dissolveDelay/);
  });

  it("throws a clear error when a follow op has a non-numeric followee id", () => {
    expect(() =>
      createUnsignedNeuronCommandTransaction(
        tx({ type: "follow", followTopic: "Governance", followeesIds: ["111", "not-a-number"] }),
        XPUB,
      ),
    ).toThrow(/numeric followee ids/);
  });

  it("throws a clear error when add_hot_key has no hotKeyToAdd", () => {
    expect(() => createUnsignedNeuronCommandTransaction(tx({ type: "add_hot_key" }), XPUB)).toThrow(
      /hotKeyToAdd/,
    );
  });

  it("throws a clear error when split_neuron has a non-integer amount", () => {
    expect(() =>
      createUnsignedNeuronCommandTransaction(
        tx({ type: "split_neuron", amount: new BigNumber(1.5) }),
        XPUB,
      ),
    ).toThrow(/integer amount/);
  });
});

describe("createUnsignedListNeuronsTransaction", () => {
  it("encodes a list_neurons call for the caller's own neurons", () => {
    const unsigned = createUnsignedListNeuronsTransaction(XPUB);
    expect(unsigned.method_name).toBe("list_neurons");
    expect(unsigned.arg.byteLength).toBeGreaterThan(0);
  });
});

describe("createReadStateRequest", () => {
  it("builds a request_status read_state over the call's request id", () => {
    const unsigned = createUnsignedNeuronCommandTransaction(
      tx({ type: "refresh_voting_power" }),
      XPUB,
    );
    const { readStateContent, requestId } = createReadStateRequest(unsigned);
    expect(readStateContent.request_type).toBe("read_state");
    expect(readStateContent.paths).toHaveLength(1);
    expect(readStateContent.paths[0]).toHaveLength(2);
    expect(new Uint8Array(requestId)).toHaveLength(32);
  });
});

describe("getNeuronStakeSubAccountIdentifier", () => {
  it("derives a 32-byte account identifier (hex) for the governance subaccount", () => {
    const id = getNeuronStakeSubAccountIdentifier(Principal.fromText(HOTKEY), 42n);
    expect(id).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("recoverStakeMemo", () => {
  const controller = derivePrincipalFromPubkey(XPUB);
  const accountIdentifier = getNeuronStakeSubAccountIdentifier(controller, 42n);
  const neuron = { id: 7n, accountIdentifier } as ICPNeuron;
  const op = (over: Partial<InternetComputerOperation>): InternetComputerOperation =>
    ({
      type: "STAKE_NEURON",
      recipients: [accountIdentifier],
      extra: { memo: "42" },
      ...over,
    }) as any;

  it("returns the memo that re-derives the neuron's subaccount", () => {
    expect(recoverStakeMemo([op({})], neuron, controller)).toBe("42");
  });

  it("rejects a candidate memo that does not re-derive the subaccount", () => {
    expect(recoverStakeMemo([op({ extra: { memo: "99" } })], neuron, controller)).toBeUndefined();
  });

  it("ignores top-up (memo 0) and transfers to other recipients", () => {
    expect(
      recoverStakeMemo(
        [op({ extra: { memo: "0" } }), op({ recipients: ["ff".repeat(32)] })],
        neuron,
        controller,
      ),
    ).toBeUndefined();
  });
});
