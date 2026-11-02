import { Cbor, requestIdOf } from "@icp-sdk/core/agent";
import { Principal } from "@icp-sdk/core/principal";
import { InvalidTransactionError } from "@ledgerhq/coin-module-framework/errors";
import { BigNumber } from "bignumber.js";
import {
  MAINNET_GOVERNANCE_CANISTER_ID,
  MAX_FOLLOWEES_PER_TOPIC,
  MAX_NAT64,
  MIN_NEURON_STAKE,
  NNS_MAXIMUM_DISSOLVE_DELAY,
  NNS_MINIMUM_DISSOLVE_DELAY,
  TRANSFER_FEE,
} from "../consts";
import {
  ICPDissolveDelayGTMax,
  ICPDissolveDelayLTMin,
  ICPDuplicateFollowee,
  ICPFolloweeIsSelf,
  ICPFollowTopicNotAllowed,
  ICPHotKeyIsController,
  ICPInvalidDissolveDelayIncrease,
  ICPInvalidFolloweeId,
  ICPInvalidHotKey,
  ICPInvalidPercentage,
  ICPTooManyFollowees,
  NotEnoughTransferAmount,
} from "../errors";
import { decodeCanisterIdlArgs, getCanisterIdlFunc, governanceIdlFactory } from "../network/candid";
import type { Transaction } from "../types";
import {
  createReadStateRequest,
  createUnsignedNeuronCommandTransaction,
} from "./buildNeuronTransaction";
import type { DecodedCallContent, DecodedReadStateContent } from "./combine";
import { deriveAddressFromPubkey, derivePrincipalFromPubkey } from "./crypto";
import type { IcpStakingIntent } from "./intent";
import { craftNeuronCommand, isNeuronCommandIntent, neuronCommandOf } from "./neuronCommand";

const PUBKEY =
  "0484bf7562262bbd6940085748f3be6afa52ae317155181ece31b66351ccffa4b08cc43d63b2859d469fee15f31c9edb5324266e6fd0407e87382d60fc4511acd8";
const SENDER = deriveAddressFromPubkey(PUBKEY);
const NOW = 1_750_760_220_000;

const command = (overrides: Record<string, unknown> = {}): IcpStakingIntent =>
  ({
    intentType: "staking",
    type: "start_dissolving",
    mode: "delegate",
    valAddress: "123",
    sender: SENDER,
    senderPublicKey: PUBKEY,
    recipient: "",
    amount: 0n,
    asset: { type: "native" },
    ...overrides,
  }) as IcpStakingIntent;

const increase = (seconds?: number): IcpStakingIntent =>
  command({
    type: "increase_dissolve_delay",
    data: { type: "neuron", additionalDissolveDelaySeconds: seconds },
  });

const withData = (
  type: string,
  data: Record<string, unknown> = {},
  overrides: Record<string, unknown> = {},
): IcpStakingIntent => command({ type, data: { type: "neuron", ...data }, ...overrides });

const SIGNER = derivePrincipalFromPubkey(PUBKEY).toText();
const HOT_KEY = Principal.fromUint8Array(new Uint8Array([1, 2, 3])).toText();
const MIN_SPLIT = BigInt(MIN_NEURON_STAKE) + TRANSFER_FEE;

// Each command with the data that builds it, and the fields it adds to the neuron id.
const COMMANDS: Array<[string, IcpStakingIntent, Partial<Transaction>]> = [
  ["start_dissolving", withData("start_dissolving"), {}],
  ["stop_dissolving", withData("stop_dissolving"), {}],
  ["disburse", withData("disburse"), {}],
  ["disburse to the sender", withData("disburse", {}, { recipient: SENDER }), {}],
  ["refresh_voting_power", withData("refresh_voting_power"), {}],
  ["increase_dissolve_delay", increase(604_800), { additionalDissolveDelay: "604800" }],
  [
    "set_dissolve_delay",
    withData("set_dissolve_delay", { dissolveDelaySeconds: NNS_MINIMUM_DISSOLVE_DELAY }),
    { dissolveDelay: String(NNS_MINIMUM_DISSOLVE_DELAY) },
  ],
  ["add_hot_key", withData("add_hot_key", { hotKey: HOT_KEY }), { hotKeyToAdd: HOT_KEY }],
  ["remove_hot_key", withData("remove_hot_key", { hotKey: HOT_KEY }), { hotKeyToRemove: HOT_KEY }],
  [
    "auto_stake_maturity",
    withData("auto_stake_maturity", { autoStakeMaturity: false }),
    { autoStakeMaturity: false },
  ],
  ["stake_maturity", withData("stake_maturity", { percentage: 50 }), { percentageToStake: "50" }],
  ["stake_maturity of all", withData("stake_maturity"), {}],
  ["spawn_neuron", withData("spawn_neuron", { percentage: 100 }), { percentageToSpawn: "100" }],
  ["spawn_neuron_from_maturity", withData("spawn_neuron_from_maturity"), {}],
  [
    "split_neuron",
    withData("split_neuron", {}, { amount: MIN_SPLIT }),
    { amount: new BigNumber(MIN_SPLIT.toString()) },
  ],
  [
    "follow",
    withData("follow", { followTopic: "Governance", followeeIds: ["0456", "789"] }),
    { followTopic: "Governance", followeesIds: ["456", "789"] },
  ],
  [
    "follow clearing the default topic",
    withData("follow", { followeeIds: [] }),
    { followTopic: "Unspecified", followeesIds: [] },
  ],
];

const decode = (hex: string) => {
  const { call, read_state } = Cbor.decode<{
    call: DecodedCallContent;
    read_state: DecodedReadStateContent;
  }>(Buffer.from(hex, "hex"));
  const [arg] = decodeCanisterIdlArgs<[unknown]>(
    getCanisterIdlFunc(governanceIdlFactory, "manage_neuron"),
    call.arg,
  );
  return { call, read_state, arg };
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});
afterEach(() => jest.useRealTimers());

describe("isNeuronCommandIntent", () => {
  it.each([
    ["a staking intent for a command", command(), true],
    ["a staking intent for another type", command({ type: "stake" }), false],
    ["a staking intent for a stake transfer", command({ type: "create_neuron" }), false],
    ["an inherited property name", command({ type: "constructor" }), false],
    ["a send", command({ intentType: "transaction" }), false],
  ])("recognizes %s", (_, intent, expected) => {
    expect(isNeuronCommandIntent(intent)).toBe(expected);
  });

  it.each(COMMANDS)("recognizes %s", (_, intent) => {
    expect(isNeuronCommandIntent(intent)).toBe(true);
  });
});

describe("neuronCommandOf", () => {
  it("targets the neuron by its canonical id", () => {
    expect(neuronCommandOf(command({ valAddress: "0123" }))).toEqual({
      type: "start_dissolving",
      neuronId: "123",
      amount: new BigNumber(0),
    });
  });

  it.each(COMMANDS)("builds %s from the intent data", (_, intent, fields) => {
    expect(neuronCommandOf(intent)).toEqual({
      type: intent.type,
      neuronId: "123",
      amount: new BigNumber(0),
      ...fields,
    });
  });

  // One second is a valid increase: the 7-day minimum applies to the total, which needs state.
  it("accepts an increase below the network minimum", () => {
    expect(neuronCommandOf(increase(1))).not.toBeInstanceOf(Error);
  });

  it.each([
    ["a neuron id that is not a number", command({ valAddress: "abc" }), InvalidTransactionError],
    ["neuron id 0", command({ valAddress: "0" }), InvalidTransactionError],
    ["a neuron id past Nat64", command({ valAddress: String(2n ** 64n) }), InvalidTransactionError],
    ["no neuron id", command({ valAddress: undefined }), InvalidTransactionError],
    ["no increase", increase(), ICPInvalidDissolveDelayIncrease],
    [
      "an increase with null data",
      command({ type: "increase_dissolve_delay", data: null }),
      ICPInvalidDissolveDelayIncrease,
    ],
    [
      "an increase with undefined data",
      command({ type: "increase_dissolve_delay", data: undefined }),
      ICPInvalidDissolveDelayIncrease,
    ],
    ["a zero increase", increase(0), ICPInvalidDissolveDelayIncrease],
    ["a fractional increase", increase(1.5), ICPInvalidDissolveDelayIncrease],
    [
      "an increase past the maximum",
      increase(NNS_MAXIMUM_DISSOLVE_DELAY + 1),
      ICPDissolveDelayGTMax,
    ],
    [
      "a delay below the minimum",
      withData("set_dissolve_delay", { dissolveDelaySeconds: NNS_MINIMUM_DISSOLVE_DELAY - 1 }),
      ICPDissolveDelayLTMin,
    ],
    [
      "a delay past the maximum",
      withData("set_dissolve_delay", { dissolveDelaySeconds: NNS_MAXIMUM_DISSOLVE_DELAY + 1 }),
      ICPDissolveDelayGTMax,
    ],
    ["no delay", withData("set_dissolve_delay"), ICPDissolveDelayLTMin],
    [
      "a fractional delay",
      withData("set_dissolve_delay", { dissolveDelaySeconds: NNS_MINIMUM_DISSOLVE_DELAY + 0.5 }),
      ICPDissolveDelayLTMin,
    ],
    ["no hot key to add", withData("add_hot_key"), ICPInvalidHotKey],
    [
      "a hot key that is not a principal",
      withData("add_hot_key", { hotKey: "x" }),
      ICPInvalidHotKey,
    ],
    [
      "the signer's own principal as hot key",
      withData("add_hot_key", { hotKey: SIGNER }),
      ICPHotKeyIsController,
    ],
    ["no hot key to remove", withData("remove_hot_key"), ICPInvalidHotKey],
    ["a partial disburse", withData("disburse", {}, { amount: 1n }), InvalidTransactionError],
    [
      "a disburse to another account",
      withData("disburse", {}, { recipient: "00".repeat(32) }),
      InvalidTransactionError,
    ],
    ["no auto-stake setting", withData("auto_stake_maturity"), InvalidTransactionError],
    ["a percentage of 0", withData("stake_maturity", { percentage: 0 }), ICPInvalidPercentage],
    ["a percentage past 100", withData("spawn_neuron", { percentage: 101 }), ICPInvalidPercentage],
    [
      "a fractional percentage",
      withData("spawn_neuron_from_maturity", { percentage: 1.5 }),
      ICPInvalidPercentage,
    ],
    [
      "a split that leaves the child under the minimum stake",
      withData("split_neuron", {}, { amount: MIN_SPLIT - 1n }),
      NotEnoughTransferAmount,
    ],
    [
      "a split past Nat64",
      withData("split_neuron", {}, { amount: MAX_NAT64 + 1n }),
      InvalidTransactionError,
    ],
    [
      "a reserved topic",
      withData("follow", { followTopic: "SnsDecentralizationSale", followeeIds: [] }),
      ICPFollowTopicNotAllowed,
    ],
    [
      "a topic the device refuses",
      withData("follow", { followTopic: "SubnetRental", followeeIds: [] }),
      ICPFollowTopicNotAllowed,
    ],
    [
      "an inherited property name as topic",
      withData("follow", { followTopic: "toString", followeeIds: [] }),
      ICPFollowTopicNotAllowed,
    ],
    ["no followees", withData("follow"), InvalidTransactionError],
    [
      "too many followees",
      withData("follow", {
        followeeIds: Array.from({ length: MAX_FOLLOWEES_PER_TOPIC + 1 }, (_, i) => String(i + 1)),
      }),
      ICPTooManyFollowees,
    ],
    [
      "a followee that is not a neuron id",
      withData("follow", { followeeIds: ["x"] }),
      ICPInvalidFolloweeId,
    ],
    [
      "a followee listed twice",
      withData("follow", { followeeIds: ["456", "0456"] }),
      ICPDuplicateFollowee,
    ],
    [
      "the neuron itself as followee",
      withData("follow", { followeeIds: ["0123"] }),
      ICPFolloweeIsSelf,
    ],
    ["another type", command({ type: "stake" }), InvalidTransactionError],
    [
      "a token",
      command({ asset: { type: "icrc1", assetReference: "x" } }),
      InvalidTransactionError,
    ],
  ])("refuses %s", (_, intent, error) => {
    expect(neuronCommandOf(intent)).toBeInstanceOf(error);
  });
});

describe("craftNeuronCommand", () => {
  it("crafts the manage_neuron call and the read_state request that polls it", () => {
    const { transaction, details } = craftNeuronCommand(command());
    const { call, read_state, arg } = decode(transaction);

    expect(Principal.fromUint8Array(call.canister_id).toText()).toBe(
      MAINNET_GOVERNANCE_CANISTER_ID,
    );
    expect(call.method_name).toBe("manage_neuron");
    expect(Principal.fromUint8Array(call.sender).toText()).toBe(
      derivePrincipalFromPubkey(PUBKEY).toText(),
    );
    expect(arg).toEqual({
      id: [{ id: 123n }],
      command: [{ Configure: { operation: [{ StartDissolving: {} }] } }],
      neuron_id_or_subaccount: [],
    });
    expect(read_state.request_type).toBe("read_state");
    expect(Buffer.from(read_state.sender)).toEqual(Buffer.from(call.sender));
    expect(read_state.ingress_expiry).toBe(call.ingress_expiry);
    expect(read_state.paths.map(path => path.map(part => Buffer.from(part)))).toEqual([
      [Buffer.from("request_status"), Buffer.from(requestIdOf(call))],
    ]);
    expect(details?.expiresAt).toBe(Number(call.ingress_expiry / 1_000_000n));
  });

  it.each(COMMANDS)("crafts %s as the account bridge signs it", (_, intent, fields) => {
    const { transaction } = craftNeuronCommand(intent);
    const bridgeCall = createUnsignedNeuronCommandTransaction(
      { type: intent.type, neuronId: "123", amount: new BigNumber(0), ...fields } as Transaction,
      PUBKEY,
    );

    expect(transaction).toBe(
      Buffer.from(
        Cbor.encode({
          call: bridgeCall,
          read_state: createReadStateRequest(bridgeCall).readStateContent,
        }),
      ).toString("hex"),
    );
  });

  it("accepts a zero custom fee", () => {
    expect(() => craftNeuronCommand(command(), { value: 0n })).not.toThrow();
  });

  it.each([
    ["a fee", command(), { value: 10_000n }, /carry no fee/],
    ["no public key", command({ senderPublicKey: undefined }), undefined, /senderPublicKey/],
    ["another sender", command({ sender: "00".repeat(32) }), undefined, /not the default account/],
    ["an invalid command", increase(0), undefined, ICPInvalidDissolveDelayIncrease],
  ])("refuses %s", (_, intent, customFees, error) => {
    expect(() => craftNeuronCommand(intent, customFees)).toThrow(error);
  });
});
