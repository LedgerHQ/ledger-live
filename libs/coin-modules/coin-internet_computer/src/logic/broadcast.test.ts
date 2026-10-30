import { Cbor, requestIdOf } from "@icp-sdk/core/agent";
import { IDL } from "@icp-sdk/core/candid";
import { Principal } from "@icp-sdk/core/principal";
import {
  ICPCallRejected,
  ICPCallUnconfirmed,
  ICPGovernanceRejected,
  ICPStakeNotRefreshed,
  ICPTransactionExpired,
} from "../errors";
import {
  broadcastTxn,
  claimOrRefreshNeuronFromAccount,
  readReplyFromCanister,
  readTransferOutcome,
} from "../network/api";
import {
  decodeCanisterIdlArgs,
  encodeCanisterIdlFunc,
  getCanisterIdlFunc,
  governanceIdlFactory,
  ledgerIdlFactory,
} from "../network/candid";
import { broadcast } from "./broadcast";
import { getNeuronStakeSubAccountIdentifier } from "./buildNeuronTransaction";
import { createUnsignedTransfer, type TransferRawRequest } from "./buildTransaction";
import { combine, type DecodedCallContent, type DecodedReadStateContent } from "./combine";
import { craftTransaction } from "./craftTransaction";
import { deriveAddressFromPubkey, derivePrincipalFromPubkey } from "./crypto";
import { hashTransaction } from "./hashTransaction";
import type { IcpStakingIntent } from "./intent";
import { craftNeuronCommand } from "./neuronCommand";

jest.mock("../network/api", () => ({
  broadcastTxn: jest.fn(),
  readTransferOutcome: jest.fn(),
  readReplyFromCanister: jest.fn(),
  throwIfLedgerTransferRefused: jest.requireActual("../network/api").throwIfLedgerTransferRefused,
  decodeManageNeuronReply: jest.requireActual("../network/api").decodeManageNeuronReply,
  claimOrRefreshNeuronFromAccount: jest.fn(),
}));

const mockBroadcastTxn = jest.mocked(broadcastTxn);
const mockReadTransferOutcome = jest.mocked(readTransferOutcome);
const mockReadReplyFromCanister = jest.mocked(readReplyFromCanister);

const PUBKEY =
  "0484bf7562262bbd6940085748f3be6afa52ae317155181ece31b66351ccffa4b08cc43d63b2859d469fee15f31c9edb5324266e6fd0407e87382d60fc4511acd8";
const SENDER = deriveAddressFromPubkey(PUBKEY);
const RECIPIENT = "e8a1474afbed438be8b019c4293b9e01b33075d72757ac715183ae7c7ba77e37";
const NOW = 1_750_760_220_000;

const signedTransfer = () => {
  const { transaction } = craftTransaction({
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    senderPublicKey: PUBKEY,
    recipient: RECIPIENT,
    amount: 100_000_000n,
    asset: { type: "native" },
    memo: { type: "string", kind: "memo", value: "7" },
  });
  return combine(transaction, ["ab".repeat(64)], PUBKEY);
};

const transferFunc = getCanisterIdlFunc(ledgerIdlFactory, "transfer");

/** The signed envelope with its transfer argument changed. */
const withTransfer = (tx: string, overrides: Record<string, unknown>) => {
  const envelope = Cbor.decode<{ content: DecodedCallContent }>(Buffer.from(tx, "hex"));
  const [request] = decodeCanisterIdlArgs<[TransferRawRequest]>(transferFunc, envelope.content.arg);
  const arg = encodeCanisterIdlFunc(transferFunc, [{ ...request, ...overrides }]);
  return Buffer.from(Cbor.encode({ ...envelope, content: { ...envelope.content, arg } })).toString(
    "hex",
  );
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  mockBroadcastTxn.mockResolvedValue(new Uint8Array([1]));
  mockReadTransferOutcome.mockResolvedValue({ Ok: 25132406n });
});
afterEach(() => {
  jest.useRealTimers();
  jest.resetAllMocks();
});

describe("broadcast", () => {
  it("submits the envelope and returns the hash listOperations reports", async () => {
    const tx = signedTransfer();

    const hash = await broadcast(tx);

    expect(hash).toBe(
      hashTransaction({
        from: SENDER,
        to: RECIPIENT,
        amount: 100_000_000n,
        fee: 10_000n,
        memo: 7n,
        created_at_time: BigInt(NOW) * 1_000_000n,
      }),
    );
    expect(mockBroadcastTxn).toHaveBeenCalledWith(
      Buffer.from(tx, "hex"),
      "ryjl3-tyaaa-aaaaa-aaaba-cai",
      "call",
    );
    // From the content as crafted, not as decoded: the certified reply is keyed by the id the node
    // computes, and the device signed the crafted content.
    const { unsignedTransaction } = createUnsignedTransfer(
      { recipient: RECIPIENT, amount: 100_000_000n, memo: 7n },
      PUBKEY,
    );
    expect(mockReadTransferOutcome).toHaveBeenCalledWith(
      new Uint8Array([1]),
      Buffer.from(requestIdOf(unsignedTransaction)).toString("hex"),
    );
  });

  it.each([
    ["from a subaccount", { from_subaccount: [new Uint8Array(32)] }, /subaccount/],
    ["without created_at_time", { created_at_time: [] }, /no created_at_time/],
  ])("refuses a transfer %s without submitting it", async (_, overrides, error) => {
    await expect(broadcast(withTransfer(signedTransfer(), overrides))).rejects.toThrow(error);
    expect(mockBroadcastTxn).not.toHaveBeenCalled();
  });

  it("refuses a call past its ingress expiry without submitting it", async () => {
    const tx = signedTransfer();
    jest.setSystemTime(NOW + 5 * 60 * 1000);

    await expect(broadcast(tx)).rejects.toThrow(ICPTransactionExpired);
    expect(mockBroadcastTxn).not.toHaveBeenCalled();
  });

  it("fails when the node returns no certificate", async () => {
    mockBroadcastTxn.mockResolvedValue(null);

    await expect(broadcast(signedTransfer())).rejects.toThrow(/no certificate/);
  });

  it("fails with the ledger's reason when it refuses the transfer", async () => {
    mockReadTransferOutcome.mockResolvedValue({
      Err: { InsufficientFunds: { balance: { e8s: 0n } } },
    });

    await expect(broadcast(signedTransfer())).rejects.toThrow(/InsufficientFunds/);
  });

  it("refuses a call that is not a ledger transfer", async () => {
    const envelope = Cbor.decode<{ content: DecodedCallContent }>(
      Buffer.from(signedTransfer(), "hex"),
    );
    const governance = Principal.fromText("rrkah-fqaaa-aaaaa-aaaaq-cai").toUint8Array();
    const tx = Buffer.from(
      Cbor.encode({ ...envelope, content: { ...envelope.content, canister_id: governance } }),
    ).toString("hex");

    await expect(broadcast(tx)).rejects.toThrow(/Not a ledger transfer/);
    expect(mockBroadcastTxn).not.toHaveBeenCalled();
  });
});

const manageNeuronReplyOf = (response: unknown) =>
  new Uint8Array(
    IDL.encode(getCanisterIdlFunc(governanceIdlFactory, "manage_neuron").retTypes, [response]),
  );

const manageNeuronReply = (command: unknown) => manageNeuronReplyOf({ command: [command] });

describe("broadcast a neuron command", () => {
  type Envelope<T> = { content: T; sender_pubkey: Uint8Array; sender_sig: Uint8Array };
  type SignedCommand = {
    call: Envelope<DecodedCallContent>;
    read_state: Envelope<DecodedReadStateContent>;
  };

  const signedCommand = () => {
    const { transaction } = craftNeuronCommand({
      intentType: "staking",
      type: "start_dissolving",
      mode: "delegate",
      valAddress: "123",
      sender: SENDER,
      senderPublicKey: PUBKEY,
      recipient: "",
      amount: 0n,
      asset: { type: "native" },
    });
    return combine(transaction, ["ab".repeat(64) + "cd".repeat(64)], PUBKEY);
  };

  const decodeSigned = (tx: string) => Cbor.decode<SignedCommand>(Buffer.from(tx, "hex"));
  const requestIdHex = (tx: string) =>
    Buffer.from(requestIdOf(decodeSigned(tx).call.content)).toString("hex");

  beforeEach(() => {
    mockReadReplyFromCanister.mockResolvedValue(manageNeuronReply({ Configure: {} }));
  });

  it("submits the call with its read_state request and returns the request id", async () => {
    const tx = signedCommand();
    const { call, read_state } = decodeSigned(tx);

    await expect(broadcast(tx)).resolves.toBe(requestIdHex(tx));
    const [callBlob, readStateBlob, canisterId, requestId] =
      mockReadReplyFromCanister.mock.calls[0];
    expect(canisterId).toBe("rrkah-fqaaa-aaaaa-aaaaq-cai");
    expect(requestId).toBe(requestIdHex(tx));
    expect(Buffer.from(Cbor.decode<SignedCommand["call"]>(callBlob).sender_sig)).toEqual(
      Buffer.from(call.sender_sig),
    );
    expect(
      Buffer.from(Cbor.decode<SignedCommand["read_state"]>(readStateBlob!).sender_sig),
    ).toEqual(Buffer.from(read_state.sender_sig));
  });

  it("fails with governance's reason when it refuses the command", async () => {
    mockReadReplyFromCanister.mockResolvedValue(
      manageNeuronReply({
        Error: { error_message: "Neuron is already dissolving", error_type: 9 },
      }),
    );

    const error = await broadcast(signedCommand()).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ICPGovernanceRejected);
    expect(error).toMatchObject({ reason: "Neuron is already dissolving" });
  });

  it("keeps the replica's rejection: the command never ran", async () => {
    mockReadReplyFromCanister.mockRejectedValue(new ICPCallRejected());

    await expect(broadcast(signedCommand())).rejects.toThrow(ICPCallRejected);
  });

  it.each([
    ["no terminal reply", () => mockReadReplyFromCanister.mockResolvedValue(null)],
    [
      "a dropped connection",
      () => mockReadReplyFromCanister.mockRejectedValue(new Error("ECONNRESET")),
    ],
    [
      "a reply that does not decode",
      () => mockReadReplyFromCanister.mockResolvedValue(new Uint8Array([0])),
    ],
    [
      "a reply without a command",
      () => mockReadReplyFromCanister.mockResolvedValue(manageNeuronReplyOf({ command: [] })),
    ],
    [
      "a reply to another command",
      () => mockReadReplyFromCanister.mockResolvedValue(manageNeuronReply({ Follow: {} })),
    ],
  ])("reports %s as unconfirmed, with the request id", async (_, arrange) => {
    arrange();
    const tx = signedCommand();

    const error = await broadcast(tx).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ICPCallUnconfirmed);
    expect(error).toMatchObject({ requestId: requestIdHex(tx) });
  });

  it("refuses a command past its ingress expiry without submitting it", async () => {
    const tx = signedCommand();
    jest.setSystemTime(NOW + 5 * 60 * 1000);

    await expect(broadcast(tx)).rejects.toThrow(ICPTransactionExpired);
    expect(mockReadReplyFromCanister).not.toHaveBeenCalled();
  });

  it("refuses a read_state request that polls another call", async () => {
    const signed = decodeSigned(signedCommand());
    const tx = Buffer.from(
      Cbor.encode({
        ...signed,
        read_state: {
          ...signed.read_state,
          content: {
            ...signed.read_state.content,
            paths: [[new TextEncoder().encode("request_status"), new Uint8Array(32)]],
          },
        },
      }),
    ).toString("hex");

    await expect(broadcast(tx)).rejects.toThrow(/does not poll this call/);
    expect(mockReadReplyFromCanister).not.toHaveBeenCalled();
  });

  it("refuses a call that is not a neuron command", async () => {
    const signed = decodeSigned(signedCommand());
    const tx = Buffer.from(
      Cbor.encode({
        ...signed,
        call: { ...signed.call, content: { ...signed.call.content, method_name: "list_neurons" } },
      }),
    ).toString("hex");

    await expect(broadcast(tx)).rejects.toThrow(/Not a neuron command/);
    expect(mockReadReplyFromCanister).not.toHaveBeenCalled();
  });
});

/** The signed stake transfer with its nonce replaced. */
const withNonce = (tx: string, stake_nonce: unknown) => {
  const { transfer } = Cbor.decode<{ transfer: unknown }>(Buffer.from(tx, "hex"));
  return Buffer.from(Cbor.encode({ transfer, stake_nonce })).toString("hex");
};

describe("broadcast a stake transfer", () => {
  const mockClaim = jest.mocked(claimOrRefreshNeuronFromAccount);
  const NONCE = 42n;
  const CONTROLLER = derivePrincipalFromPubkey(PUBKEY);
  const STAKE_ACCOUNT = getNeuronStakeSubAccountIdentifier(CONTROLLER, NONCE);

  const signedStake = () => {
    const intent: IcpStakingIntent = {
      intentType: "staking",
      type: "create_neuron",
      mode: "delegate",
      valAddress: "rrkah-fqaaa-aaaaa-aaaaq-cai",
      sender: SENDER,
      senderPublicKey: PUBKEY,
      recipient: STAKE_ACCOUNT,
      amount: 100_000_000n,
      asset: { type: "native" },
      data: { type: "neuron", stakeNonce: String(NONCE) },
    };
    return combine(craftTransaction(intent).transaction, ["ab".repeat(64)], PUBKEY);
  };

  const HASH = hashTransaction({
    from: SENDER,
    to: STAKE_ACCOUNT,
    amount: 100_000_000n,
    fee: 10_000n,
    memo: NONCE,
    created_at_time: BigInt(NOW) * 1_000_000n,
  });
  const SETTLED = { transactionHash: HASH, stakeNonce: String(NONCE) };

  beforeEach(() => mockClaim.mockResolvedValue(123n));

  it("submits the transfer alone, claims its neuron and returns the transfer hash", async () => {
    const tx = signedStake();
    const { transfer } = Cbor.decode<{ transfer: unknown }>(Buffer.from(tx, "hex"));

    await expect(broadcast(tx)).resolves.toBe(HASH);
    expect(mockBroadcastTxn).toHaveBeenCalledWith(
      Buffer.from(Cbor.encode(transfer)),
      "ryjl3-tyaaa-aaaaa-aaaba-cai",
      "call",
    );
    expect(mockClaim).toHaveBeenCalledWith(CONTROLLER, NONCE);
  });

  it.each([
    ["another account", String(NONCE + 1n), /does not name/],
    ["no Nat64", "x", /Not a stake nonce/],
  ])("refuses a nonce that names %s without submitting it", async (_, nonce, error) => {
    await expect(broadcast(withNonce(signedStake(), nonce))).rejects.toThrow(error);
    expect(mockBroadcastTxn).not.toHaveBeenCalled();
  });

  it("fails when the ledger refuses the transfer, without claiming", async () => {
    mockReadTransferOutcome.mockResolvedValue({
      Err: { InsufficientFunds: { balance: { e8s: 1n } } },
    });

    await expect(broadcast(signedStake())).rejects.toThrow(/InsufficientFunds/);
    expect(mockClaim).not.toHaveBeenCalled();
  });

  // An earlier delivery of the same signed transfer settled, and its answer was lost.
  it("claims the neuron of a transfer the ledger already holds", async () => {
    mockReadTransferOutcome.mockResolvedValue({ Err: { TxDuplicate: { duplicate_of: 1n } } });

    await expect(broadcast(signedStake())).resolves.toBe(HASH);
    expect(mockClaim).toHaveBeenCalledWith(CONTROLLER, NONCE);
  });

  it("keeps the replica's rejection: the transfer never ran", async () => {
    mockReadTransferOutcome.mockRejectedValue(new ICPCallRejected());

    await expect(broadcast(signedStake())).rejects.toBeInstanceOf(ICPCallRejected);
    expect(mockClaim).not.toHaveBeenCalled();
  });

  it.each([
    ["no certificate", () => mockBroadcastTxn.mockResolvedValue(null)],
    [
      "an outcome it cannot read",
      () => mockReadTransferOutcome.mockRejectedValue(new Error("Decoding failed")),
    ],
  ])("reports a transfer with %s as unconfirmed, with its hash", async (_, arrange) => {
    arrange();

    const error = await broadcast(signedStake()).catch(e => e);

    expect(error).toBeInstanceOf(ICPCallUnconfirmed);
    expect(error).toMatchObject(SETTLED);
    expect(mockClaim).not.toHaveBeenCalled();
  });

  it("reports a refused claim with the settled transfer", async () => {
    mockClaim.mockRejectedValue(new ICPStakeNotRefreshed("refused", { reason: "refused" }));

    const error = await broadcast(signedStake()).catch(e => e);

    expect(error).toBeInstanceOf(ICPStakeNotRefreshed);
    expect(error).toMatchObject({ ...SETTLED, reason: "refused" });
  });

  it.each([
    ["no answer settles", () => mockClaim.mockResolvedValue(undefined)],
    ["fails on the way", () => mockClaim.mockRejectedValue(new Error("network down"))],
  ])("reports a claim that %s as unconfirmed, with the settled transfer", async (_, arrange) => {
    arrange();

    const error = await broadcast(signedStake()).catch(e => e);

    expect(error).toBeInstanceOf(ICPCallUnconfirmed);
    expect(error).toMatchObject(SETTLED);
  });

  // It may have settled before its answer was lost, so the refusal carries what a claim needs.
  it("refuses a transfer past its ingress expiry without submitting it, with its hash", async () => {
    const tx = signedStake();
    jest.setSystemTime(NOW + 10 * 60 * 1000);

    const error = await broadcast(tx).catch(e => e);

    expect(error).toBeInstanceOf(ICPTransactionExpired);
    expect(error).toMatchObject(SETTLED);
    expect(mockBroadcastTxn).not.toHaveBeenCalled();
  });
});
