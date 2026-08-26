import { getNeuronStakeSubAccountIdentifier } from "../logic/buildNeuronTransaction";
import { derivePrincipalFromPubkey } from "../logic/crypto";
import type { InternetComputerOperation } from "../types";
import { getBufferFromString, isValidHex, reassignOperationType } from "./utils";

describe("isValidHex", () => {
  it("accepts a whole even-length hex string (>= 3 bytes)", () => {
    expect(isValidHex("deadbeef")).toBe(true);
  });

  it("rejects a hex run embedded in non-hex text", () => {
    expect(isValidHex("hello deadbeef world")).toBe(false);
  });

  it("rejects odd-length, too-short (< 3 bytes), and empty input", () => {
    expect(isValidHex("abc")).toBe(false);
    expect(isValidHex("12")).toBe(false);
    expect(isValidHex("1234")).toBe(false);
    expect(isValidHex("")).toBe(false);
  });
});

describe("getBufferFromString", () => {
  it("hex-decodes a whole hex string", () => {
    expect(getBufferFromString("deadbeef")).toEqual(Buffer.from("deadbeef", "hex"));
  });

  it("keeps text with an embedded hex run as UTF-8 (no spurious hex decode)", () => {
    const message = "hello deadbeef world";
    expect(getBufferFromString(message)).toEqual(Buffer.from(message));
  });

  it("does not hex-decode a short hex-looking string (preserves the prior boundary)", () => {
    expect(getBufferFromString("1234")).toEqual(Buffer.from("1234", "base64"));
  });
});

describe("reassignOperationType", () => {
  const PUBKEY =
    "0484bf7562262bbd6940085748f3be6afa52ae317155181ece31b66351ccffa4b08cc43d63b2859d469fee15f31c9edb5324266e6fd0407e87382d60fc4511acd8";
  const CONTROLLER = derivePrincipalFromPubkey(PUBKEY);
  const NONCE = 1234n;
  const NEURON_ADDRESS = getNeuronStakeSubAccountIdentifier(CONTROLLER, NONCE);

  const transfer = (overrides: Partial<InternetComputerOperation> = {}) =>
    ({
      id: "op-1",
      hash: "hash-1",
      accountId: "account-1",
      type: "OUT",
      recipients: [NEURON_ADDRESS],
      senders: ["sender"],
      extra: { memo: NONCE.toString() },
      ...overrides,
    }) as unknown as InternetComputerOperation;

  it("labels a transfer to a known neuron account a stake", () => {
    const [op] = reassignOperationType([transfer()], [NEURON_ADDRESS]);

    expect(op!.type).toBe("STAKE_NEURON");
  });

  // The snapshot only arrives with a device-signed list_neurons, so before the first refresh there
  // was nothing to match against and a settled stake was relabelled a plain send.
  it("recognizes the account's own stake with no snapshot at all", () => {
    const [op] = reassignOperationType([transfer()], [], CONTROLLER);

    expect(op!.type).toBe("STAKE_NEURON");
  });

  it("leaves it alone when no controller is supplied to derive from", () => {
    const [op] = reassignOperationType([transfer()], []);

    expect(op!.type).toBe("OUT");
  });

  // The derivation is what proves the recipient is this controller's neuron; a memo that does not
  // hash to the recipient is just a memo on an ordinary transfer.
  it("does not claim a transfer whose memo does not derive the recipient", () => {
    const [op] = reassignOperationType([transfer({ extra: { memo: "999" } })], [], CONTROLLER);

    expect(op!.type).toBe("OUT");
  });

  it("does not claim a transfer to somewhere else entirely", () => {
    const [op] = reassignOperationType(
      [transfer({ recipients: ["cd".repeat(32)] })],
      [],
      CONTROLLER,
    );

    expect(op!.type).toBe("OUT");
  });

  // A top-up carries memo 0, so its recipient cannot be derived — only the snapshot identifies it.
  it("labels an unmemo'd transfer to a known neuron a top-up", () => {
    const [op] = reassignOperationType(
      [transfer({ extra: { memo: "0" } })],
      [NEURON_ADDRESS],
      CONTROLLER,
    );

    expect(op!.type).toBe("TOP_UP_NEURON");
  });

  it.each(["IN", "STAKE_NEURON", "NONE"])("never touches a %s operation", type => {
    const [op] = reassignOperationType([transfer({ type })], [NEURON_ADDRESS], CONTROLLER);

    expect(op!.type).toBe(type);
  });

  it("survives a memo that is not a number", () => {
    const [op] = reassignOperationType(
      [transfer({ extra: { memo: "not-a-nonce" } })],
      [],
      CONTROLLER,
    );

    expect(op!.type).toBe("OUT");
  });
});
