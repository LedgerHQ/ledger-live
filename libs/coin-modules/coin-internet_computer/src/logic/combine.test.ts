import { Cbor, requestIdOf } from "@icp-sdk/core/agent";
import { getNeuronStakeSubAccountIdentifier } from "./buildNeuronTransaction";
import { combine, type DecodedCallContent, type DecodedReadStateContent } from "./combine";
import { craftTransaction } from "./craftTransaction";
import { deriveAddressFromPubkey, derivePrincipalFromPubkey, pubkeyToDer } from "./crypto";
import type { IcpStakingIntent } from "./intent";
import { craftNeuronCommand } from "./neuronCommand";

const PUBKEY =
  "0484bf7562262bbd6940085748f3be6afa52ae317155181ece31b66351ccffa4b08cc43d63b2859d469fee15f31c9edb5324266e6fd0407e87382d60fc4511acd8";
// The secp256k1 generator point: a valid key of another principal.
const OTHER_PUBKEY =
  "0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8";
const SIGNATURE = "ab".repeat(64);

const crafted = () =>
  craftTransaction({
    intentType: "transaction",
    type: "send",
    sender: deriveAddressFromPubkey(PUBKEY),
    senderPublicKey: PUBKEY,
    recipient: "e8a1474afbed438be8b019c4293b9e01b33075d72757ac715183ae7c7ba77e37",
    amount: 1n,
    asset: { type: "native" },
  }).transaction;

describe("combine", () => {
  it("wraps the content with the DER public key and the signature", () => {
    const tx = crafted();
    const { content: original } = Cbor.decode<{ content: DecodedCallContent }>(
      Buffer.from(tx, "hex"),
    );

    const envelope = Cbor.decode<{
      content: DecodedCallContent;
      sender_pubkey: Uint8Array;
      sender_sig: Uint8Array;
    }>(Buffer.from(combine(tx, [SIGNATURE], PUBKEY), "hex"));

    expect(Buffer.from(envelope.sender_pubkey)).toEqual(Buffer.from(pubkeyToDer(PUBKEY)));
    expect(Buffer.from(envelope.sender_sig).toString("hex")).toBe(SIGNATURE);
    // The node checks the signature against the request id, so the content must hash the same.
    expect(Buffer.from(requestIdOf(envelope.content))).toEqual(Buffer.from(requestIdOf(original)));
  });

  it.each([
    ["no signature", []],
    ["two signatures", [SIGNATURE, SIGNATURE]],
  ])("refuses %s", (_, signatures) => {
    const tx = crafted();
    expect(() => combine(tx, signatures, PUBKEY)).toThrow(/exactly one signature/);
  });

  it.each([
    ["a non-hex signature", `zz${SIGNATURE.slice(2)}`],
    ["a short signature", SIGNATURE.slice(2)],
    ["a DER signature", `30${SIGNATURE}`],
  ])("refuses %s", (_, signature) => {
    const tx = crafted();
    expect(() => combine(tx, [signature], PUBKEY)).toThrow(/64-byte hex signature/);
  });

  it("requires the public key", () => {
    const tx = crafted();
    expect(() => combine(tx, [SIGNATURE], undefined)).toThrow(/pubkey is required/);
  });

  it("refuses a public key other than the sender's", () => {
    const tx = crafted();
    expect(() => combine(tx, [SIGNATURE], OTHER_PUBKEY)).toThrow(/does not match/);
  });
});

describe("combine a neuron command", () => {
  const CALL_SIGNATURE = "ab".repeat(64);
  const READ_STATE_SIGNATURE = "cd".repeat(64);

  const command = () =>
    craftNeuronCommand({
      intentType: "staking",
      type: "start_dissolving",
      mode: "delegate",
      valAddress: "123",
      sender: deriveAddressFromPubkey(PUBKEY),
      senderPublicKey: PUBKEY,
      recipient: "",
      amount: 0n,
      asset: { type: "native" },
    }).transaction;

  type Envelope<T> = { content: T; sender_pubkey: Uint8Array; sender_sig: Uint8Array };
  const decode = (hex: string) =>
    Cbor.decode<{
      call: Envelope<DecodedCallContent>;
      read_state: Envelope<DecodedReadStateContent>;
    }>(Buffer.from(hex, "hex"));

  it("signs the call and the read_state request, each in its own envelope", () => {
    const tx = command();
    const unsigned = Cbor.decode<{ call: DecodedCallContent; read_state: DecodedReadStateContent }>(
      Buffer.from(tx, "hex"),
    );

    const { call, read_state } = decode(
      combine(tx, [CALL_SIGNATURE + READ_STATE_SIGNATURE], PUBKEY),
    );

    expect(Buffer.from(call.sender_sig).toString("hex")).toBe(CALL_SIGNATURE);
    expect(Buffer.from(read_state.sender_sig).toString("hex")).toBe(READ_STATE_SIGNATURE);
    expect(Buffer.from(call.sender_pubkey)).toEqual(Buffer.from(pubkeyToDer(PUBKEY)));
    expect(Buffer.from(read_state.sender_pubkey)).toEqual(Buffer.from(pubkeyToDer(PUBKEY)));
    expect(Buffer.from(requestIdOf(call.content))).toEqual(Buffer.from(requestIdOf(unsigned.call)));
    expect(Buffer.from(requestIdOf(read_state.content))).toEqual(
      Buffer.from(requestIdOf(unsigned.read_state)),
    );
  });

  it.each([
    ["one 64-byte signature", SIGNATURE],
    ["a non-hex signature", `zz${(CALL_SIGNATURE + READ_STATE_SIGNATURE).slice(2)}`],
  ])("refuses %s", (_, signature) => {
    expect(() => combine(command(), [signature], PUBKEY)).toThrow(/128-byte hex signature/);
  });

  it("refuses a public key other than the sender's", () => {
    expect(() => combine(command(), [CALL_SIGNATURE + READ_STATE_SIGNATURE], OTHER_PUBKEY)).toThrow(
      /does not match/,
    );
  });

  it("refuses a read_state request from another sender", () => {
    const unsigned = Cbor.decode<{ call: DecodedCallContent; read_state: DecodedReadStateContent }>(
      Buffer.from(command(), "hex"),
    );
    const tx = Buffer.from(
      Cbor.encode({
        ...unsigned,
        read_state: { ...unsigned.read_state, sender: derivePrincipalFromPubkey(OTHER_PUBKEY) },
      }),
    ).toString("hex");

    expect(() => combine(tx, [CALL_SIGNATURE + READ_STATE_SIGNATURE], PUBKEY)).toThrow(
      /another sender/,
    );
  });
});

describe("combine a stake transfer", () => {
  const NONCE = 42n;
  const intent: IcpStakingIntent = {
    intentType: "staking",
    type: "create_neuron",
    mode: "delegate",
    valAddress: "rrkah-fqaaa-aaaaa-aaaaq-cai",
    sender: deriveAddressFromPubkey(PUBKEY),
    senderPublicKey: PUBKEY,
    recipient: getNeuronStakeSubAccountIdentifier(derivePrincipalFromPubkey(PUBKEY), NONCE),
    amount: 100_000_000n,
    asset: { type: "native" },
    data: { type: "neuron", stakeNonce: String(NONCE) },
  };
  const stakeTransfer = () => craftTransaction(intent).transaction;

  it("keeps the nonce beside the signed envelope", () => {
    const tx = stakeTransfer();
    const { content: original } = Cbor.decode<{ content: DecodedCallContent }>(
      Buffer.from(tx, "hex"),
    );

    const { transfer, stake_nonce } = Cbor.decode<{
      transfer: { content: DecodedCallContent; sender_sig: Uint8Array };
      stake_nonce: string;
    }>(Buffer.from(combine(tx, [SIGNATURE], PUBKEY), "hex"));

    expect(stake_nonce).toBe(String(NONCE));
    expect(Buffer.from(transfer.sender_sig).toString("hex")).toBe(SIGNATURE);
    expect(Buffer.from(requestIdOf(transfer.content))).toEqual(Buffer.from(requestIdOf(original)));
  });

  it("refuses a nonce that is not a string", () => {
    const { content } = Cbor.decode<{ content: DecodedCallContent }>(
      Buffer.from(stakeTransfer(), "hex"),
    );
    const tx = Buffer.from(Cbor.encode({ content, stake_nonce: NONCE })).toString("hex");

    expect(() => combine(tx, [SIGNATURE], PUBKEY)).toThrow(/stake nonce/);
  });
});
