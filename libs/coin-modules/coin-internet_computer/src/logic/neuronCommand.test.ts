import { Cbor, requestIdOf } from "@icp-sdk/core/agent";
import { Principal } from "@icp-sdk/core/principal";
import { InvalidTransactionError } from "@ledgerhq/coin-module-framework/errors";
import { BigNumber } from "bignumber.js";
import { MAINNET_GOVERNANCE_CANISTER_ID, NNS_MAXIMUM_DISSOLVE_DELAY } from "../consts";
import { ICPDissolveDelayGTMax, ICPInvalidDissolveDelayIncrease } from "../errors";
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
    ["a send", command({ intentType: "transaction" }), false],
  ])("recognizes %s", (_, intent, expected) => {
    expect(isNeuronCommandIntent(intent)).toBe(expected);
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

  it("reads the increase from the intent data", () => {
    expect(neuronCommandOf(increase(604_800))).toMatchObject({
      type: "increase_dissolve_delay",
      additionalDissolveDelay: "604800",
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

  it("crafts the call and read_state request the account bridge signs", () => {
    const { transaction } = craftNeuronCommand(increase(604_800));
    const bridgeCall = createUnsignedNeuronCommandTransaction(
      {
        type: "increase_dissolve_delay",
        neuronId: "123",
        additionalDissolveDelay: "604800",
        amount: new BigNumber(0),
      } as Transaction,
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
