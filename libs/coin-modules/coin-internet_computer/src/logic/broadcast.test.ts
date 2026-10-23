import { Cbor, requestIdOf } from "@icp-sdk/core/agent";
import { Principal } from "@icp-sdk/core/principal";
import { ICPTransactionExpired } from "../errors";
import { broadcastTxn, readTransferOutcome } from "../network/api";
import {
  decodeCanisterIdlArgs,
  encodeCanisterIdlFunc,
  getCanisterIdlFunc,
  ledgerIdlFactory,
} from "../network/candid";
import { broadcast } from "./broadcast";
import { createUnsignedTransfer, type TransferRawRequest } from "./buildTransaction";
import { combine, type DecodedCallContent } from "./combine";
import { craftTransaction } from "./craftTransaction";
import { deriveAddressFromPubkey } from "./crypto";
import { hashTransaction } from "./hashTransaction";

jest.mock("../network/api", () => ({
  broadcastTxn: jest.fn(),
  readTransferOutcome: jest.fn(),
  throwIfLedgerTransferRefused: jest.requireActual("../network/api").throwIfLedgerTransferRefused,
}));

const mockBroadcastTxn = jest.mocked(broadcastTxn);
const mockReadTransferOutcome = jest.mocked(readTransferOutcome);

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
