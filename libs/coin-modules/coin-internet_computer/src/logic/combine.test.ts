import { Cbor, requestIdOf } from "@icp-sdk/core/agent";
import { combine, type DecodedCallContent } from "./combine";
import { craftTransaction } from "./craftTransaction";
import { deriveAddressFromPubkey, pubkeyToDer } from "./crypto";

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
