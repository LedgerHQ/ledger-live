import { getNeuronStakeSubAccountIdentifier } from "../logic/buildNeuronTransaction";
import { derivePrincipalFromPubkey } from "../logic/crypto";
import type { InternetComputerOperation } from "../types";
import {
  dedupeRetypedOperations,
  getBufferFromString,
  isValidHex,
  reassignOperationType,
} from "./utils";

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

/*
 * QA saw stake and top-up rows appear two and three times over. An operation id encodes its type and
 * `mergeOps` dedups on that id, so reclassifying a transfer mints an id the merge has never seen:
 * the retyped operation joins the stale `OUT` instead of replacing it, and nothing removes the loser.
 */
describe("dedupeRetypedOperations", () => {
  const op = (overrides: Partial<InternetComputerOperation>) =>
    ({
      accountId: "account-1",
      senders: ["sender"],
      recipients: ["recipient"],
      extra: {},
      ...overrides,
    }) as unknown as InternetComputerOperation;

  // An IN and an OUT legitimately share a hash on a self-transfer, so hash alone must not collapse.
  it("keeps an incoming operation that shares its hash with an outgoing one", () => {
    const kept = dedupeRetypedOperations([
      op({ id: "a-h1-OUT", hash: "h1", type: "OUT" }),
      op({ id: "a-h1-IN", hash: "h1", type: "IN" }),
    ]);

    expect(kept.map(o => o.type)).toEqual(["OUT", "IN"]);
  });

  it("keeps a plain send that no neuron operation supersedes", () => {
    const kept = dedupeRetypedOperations([
      op({ id: "a-h1-OUT", hash: "h1", type: "OUT" }),
      op({ id: "a-h2-STAKE_NEURON", hash: "h2", type: "STAKE_NEURON" }),
    ]);

    expect(kept).toHaveLength(2);
  });

  it("drops the stale send once the same transfer is known to be a stake", () => {
    const kept = dedupeRetypedOperations([
      op({ id: "a-h1-STAKE_NEURON", hash: "h1", type: "STAKE_NEURON" }),
      op({ id: "a-h1-OUT", hash: "h1", type: "OUT" }),
    ]);

    expect(kept.map(o => o.id)).toEqual(["a-h1-STAKE_NEURON"]);
  });

  // A top-up carries memo 0, so it is only recognizable once a signed list_neurons has landed.
  it("drops the stale send once the same transfer is known to be a top-up", () => {
    const kept = dedupeRetypedOperations([
      op({ id: "a-h1-TOP_UP_NEURON", hash: "h1", type: "TOP_UP_NEURON" }),
      op({ id: "a-h1-OUT", hash: "h1", type: "OUT" }),
    ]);

    expect(kept.map(o => o.id)).toEqual(["a-h1-TOP_UP_NEURON"]);
  });

  // The in-place retype collapses the leftover OUT onto an id already present, so the account ends
  // up holding the very same operation twice. QA's export held one stake three times over.
  it("collapses operations that are already byte-identical", () => {
    const stake = op({ id: "a-h1-STAKE_NEURON", hash: "h1", type: "STAKE_NEURON" });

    expect(dedupeRetypedOperations([stake, stake, stake])).toEqual([stake]);
  });

  it("preserves the order of what it keeps", () => {
    const kept = dedupeRetypedOperations([
      op({ id: "a-h3-IN", hash: "h3", type: "IN" }),
      op({ id: "a-h2-TOP_UP_NEURON", hash: "h2", type: "TOP_UP_NEURON" }),
      op({ id: "a-h2-OUT", hash: "h2", type: "OUT" }),
      op({ id: "a-h1-OUT", hash: "h1", type: "OUT" }),
    ]);

    expect(kept.map(o => o.id)).toEqual(["a-h3-IN", "a-h2-TOP_UP_NEURON", "a-h1-OUT"]);
  });
});
