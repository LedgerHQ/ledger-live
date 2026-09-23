import { MAINNET_GOVERNANCE_CANISTER_ID, MAINNET_LEDGER_CANISTER_ID } from "../consts";
import {
  ICPCallRejected,
  ICPCallUnconfirmed,
  ICPNeuronsNotRead,
  ICPNodeRefused,
  ICPStakeNotRefreshed,
} from "../errors";
import { broadcast } from "./broadcast";

jest.mock("../api");
jest.mock("../logic/crypto");
jest.mock("../common-logic/neuron");

import * as api from "../api";
import { derivePrincipalFromPubkey } from "../logic/crypto";
import { toNeuronsData } from "../common-logic/neuron";

const account = { xpub: "04abcd" } as any;
const signed = (rawData: any) => ({
  account,
  signedOperation: { operation: { extra: {} } as any, signature: "", rawData },
});

describe("broadcast routing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (derivePrincipalFromPubkey as jest.Mock).mockReturnValue({ __principal: true });
    (api.broadcastTxn as jest.Mock).mockResolvedValue(new Uint8Array());
    (api.readTransferOutcome as jest.Mock).mockResolvedValue({ Ok: 1n });
    (api.readReplyFromCanister as jest.Mock).mockResolvedValue(new ArrayBuffer(0));
  });

  it("submits a create_neuron transfer to the ledger canister and claims the neuron", async () => {
    (api.claimOrRefreshNeuronFromAccount as jest.Mock).mockResolvedValue(123n);

    const op = await broadcast(
      signed({
        encodedSignedCallBlob: "aa",
        transferRequestIdHex: "bb",
        methodName: "create_neuron",
        stakeNonce: "42",
      }),
    );

    expect(api.broadcastTxn).toHaveBeenCalledWith(
      expect.anything(),
      MAINNET_LEDGER_CANISTER_ID,
      "call",
    );
    expect(api.claimOrRefreshNeuronFromAccount).toHaveBeenCalledWith({ __principal: true }, 42n);
    expect((op.extra as any).createdNeuronId).toBe("123");
  });

  it("throws unconfirmed when the neuron claim can't be confirmed after the transfer", async () => {
    (api.claimOrRefreshNeuronFromAccount as jest.Mock).mockResolvedValue(undefined);

    await expect(
      broadcast(
        signed({
          encodedSignedCallBlob: "aa",
          transferRequestIdHex: "bb",
          methodName: "create_neuron",
          stakeNonce: "42",
        }),
      ),
    ).rejects.toThrow(ICPCallUnconfirmed);
  });

  // Past the settled transfer nothing is a failed transaction: the ICP has left the account whatever
  // the claim did. A failure with no verdict — the connection dropped, a certificate that did not
  // verify — is reported as unconfirmed, as an exhausted poll is, so the app files the stake rather
  // than offering it again.
  it("reports a claim that failed without a verdict as unconfirmed, keeping the cause", async () => {
    const dropped = new TypeError("Network request failed");
    (api.claimOrRefreshNeuronFromAccount as jest.Mock).mockRejectedValueOnce(dropped);

    const attempt = broadcast(
      signed({
        encodedSignedCallBlob: "aa",
        transferRequestIdHex: "bb",
        methodName: "create_neuron",
        stakeNonce: "42",
      }),
    );

    await expect(attempt).rejects.toThrow(ICPCallUnconfirmed);
    await expect(attempt).rejects.toMatchObject({ cause: dropped });
  });

  // A refusal is a verdict, and says more than "unknown": it passes through untouched.
  it("passes a refused claim through as the stake left unclaimed", async () => {
    (api.claimOrRefreshNeuronFromAccount as jest.Mock).mockRejectedValueOnce(
      new ICPStakeNotRefreshed("denied", { reason: "denied" }),
    );

    await expect(
      broadcast(
        signed({
          encodedSignedCallBlob: "aa",
          transferRequestIdHex: "bb",
          methodName: "create_neuron",
          stakeNonce: "42",
        }),
      ),
    ).rejects.toThrow(ICPStakeNotRefreshed);
  });

  // Without a certified answer the transfer may still go through; a failure would send the user
  // back to stake again with a fresh nonce. A neuron transfer is therefore reported as unconfirmed
  // — the node took it without certifying, or the connection dropped — while a refusal, which says
  // the message was never taken, stays the failure it is.
  it("reports a neuron transfer the node took without certifying as unconfirmed", async () => {
    (api.broadcastTxn as jest.Mock).mockResolvedValueOnce(null);

    await expect(
      broadcast(
        signed({
          encodedSignedCallBlob: "aa",
          transferRequestIdHex: "bb",
          methodName: "create_neuron",
          stakeNonce: "42",
        }),
      ),
    ).rejects.toThrow(ICPCallUnconfirmed);
    expect(api.readTransferOutcome).not.toHaveBeenCalled();
    expect(api.claimOrRefreshNeuronFromAccount).not.toHaveBeenCalled();
  });

  it("reports a neuron transfer whose submission failed as unconfirmed, keeping the cause", async () => {
    const dropped = new TypeError("Network request failed");
    (api.broadcastTxn as jest.Mock).mockRejectedValueOnce(dropped);

    const attempt = broadcast(
      signed({
        encodedSignedCallBlob: "aa",
        transferRequestIdHex: "bb",
        methodName: "create_neuron",
        stakeNonce: "42",
      }),
    );

    await expect(attempt).rejects.toThrow(ICPCallUnconfirmed);
    await expect(attempt).rejects.toMatchObject({ cause: dropped });
  });

  it("passes a refusal of a neuron transfer through", async () => {
    (api.broadcastTxn as jest.Mock).mockRejectedValueOnce(
      new ICPNodeRefused("Failed to broadcast transaction: expired", { status: 403 }),
    );

    await expect(
      broadcast(
        signed({
          encodedSignedCallBlob: "aa",
          transferRequestIdHex: "bb",
          methodName: "create_neuron",
          stakeNonce: "42",
        }),
      ),
    ).rejects.toThrow(ICPNodeRefused);
  });

  // The node answered, but with something that could not be read as a verdict — a certificate that
  // did not verify, a body that did not decode. The transfer may have gone through all the same.
  it("reports a neuron transfer whose answer could not be read as unconfirmed, keeping the cause", async () => {
    const unreadable = new Error("Invalid certificate");
    (api.readTransferOutcome as jest.Mock).mockRejectedValueOnce(unreadable);

    const attempt = broadcast(
      signed({
        encodedSignedCallBlob: "aa",
        transferRequestIdHex: "bb",
        methodName: "create_neuron",
        stakeNonce: "42",
      }),
    );

    await expect(attempt).rejects.toThrow(ICPCallUnconfirmed);
    await expect(attempt).rejects.toMatchObject({ cause: unreadable });
    expect(api.claimOrRefreshNeuronFromAccount).not.toHaveBeenCalled();
  });

  // A certified rejection is a verdict: the transfer never ran, so a retry stakes once.
  it("passes a rejection of a neuron transfer through", async () => {
    (api.readTransferOutcome as jest.Mock).mockRejectedValueOnce(
      new ICPCallRejected("[ICP] call rejected: boom", { reason: "boom" }),
    );

    await expect(
      broadcast(
        signed({
          encodedSignedCallBlob: "aa",
          transferRequestIdHex: "bb",
          methodName: "create_neuron",
          stakeNonce: "42",
        }),
      ),
    ).rejects.toThrow(ICPCallRejected);
    expect(api.claimOrRefreshNeuronFromAccount).not.toHaveBeenCalled();
  });

  it("keeps a plain send whose answer could not be read a failure", async () => {
    (api.readTransferOutcome as jest.Mock).mockRejectedValueOnce(new Error("Invalid certificate"));

    const attempt = broadcast(
      signed({ encodedSignedCallBlob: "aa", transferRequestIdHex: "bb", methodName: "send" }),
    );

    await expect(attempt).rejects.toThrow(/Invalid certificate/);
    await expect(attempt).rejects.not.toBeInstanceOf(ICPCallUnconfirmed);
  });

  // A plain send has no stake to record and a flow of its own: it keeps reporting a failure.
  it("keeps a plain send the node took without certifying a failure", async () => {
    (api.broadcastTxn as jest.Mock).mockResolvedValueOnce(null);

    const attempt = broadcast(
      signed({ encodedSignedCallBlob: "aa", transferRequestIdHex: "bb", methodName: "send" }),
    );

    await expect(attempt).rejects.toThrow(/no certificate/);
    await expect(attempt).rejects.not.toBeInstanceOf(ICPCallUnconfirmed);
  });

  // The ledger refusing the transfer is the one failure that stays generic: nothing moved.
  it("leaves a refusal by the ledger as it is", async () => {
    (api.throwIfLedgerTransferRefused as jest.Mock).mockImplementationOnce(() => {
      throw new Error("TxTooOld");
    });

    const attempt = broadcast(
      signed({
        encodedSignedCallBlob: "aa",
        transferRequestIdHex: "bb",
        methodName: "create_neuron",
        stakeNonce: "42",
      }),
    );

    await expect(attempt).rejects.toThrow("TxTooOld");
    await expect(attempt).rejects.not.toBeInstanceOf(ICPCallUnconfirmed);
    expect(api.claimOrRefreshNeuronFromAccount).not.toHaveBeenCalled();
  });

  it("submits a governance command to the governance canister and decodes the reply", async () => {
    await broadcast(
      signed({
        encodedSignedCallBlob: "aa",
        encodedSignedReadStateBlob: "cc",
        requestId: "dd",
        methodName: "start_dissolving",
      }),
    );

    expect(api.readReplyFromCanister).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      MAINNET_GOVERNANCE_CANISTER_ID,
      "dd",
    );
    expect(api.decodeManageNeuronReply).toHaveBeenCalled();
  });

  // Without this the figures never leave the decoder, and the flow has to guess at the split from the
  // percentage the user chose.
  it("carries what the command reported about itself onto the operation", async () => {
    const outcome = { maturityE8s: "200000000", stakedMaturityE8s: "300000000" };
    (api.decodeManageNeuronReply as jest.Mock).mockReturnValue(outcome);

    const op = await broadcast(
      signed({
        encodedSignedCallBlob: "aa",
        encodedSignedReadStateBlob: "cc",
        requestId: "dd",
        methodName: "stake_maturity",
      }),
    );

    expect((op.extra as any).outcome).toEqual(outcome);
  });

  it("leaves the operation alone for a command that reported nothing", async () => {
    (api.decodeManageNeuronReply as jest.Mock).mockReturnValue(undefined);

    const op = await broadcast(
      signed({
        encodedSignedCallBlob: "aa",
        encodedSignedReadStateBlob: "cc",
        requestId: "dd",
        methodName: "start_dissolving",
      }),
    );

    expect(op.extra).toEqual({});
  });

  it("throws unconfirmed on an indeterminate manage_neuron reply (no false success / double-execute)", async () => {
    (api.readReplyFromCanister as jest.Mock).mockResolvedValue(null);

    await expect(
      broadcast(
        signed({
          encodedSignedCallBlob: "aa",
          encodedSignedReadStateBlob: "cc",
          requestId: "dd",
          methodName: "start_dissolving",
        }),
      ),
    ).rejects.toThrow(ICPCallUnconfirmed);
    expect(api.decodeManageNeuronReply).not.toHaveBeenCalled();
  });

  // Reporting this as a successful broadcast spent a signature and then told the user their neurons
  // were up to date, with the snapshot untouched. Nothing was read, so say so.
  it("reports an indeterminate list_neurons reply rather than an unchanged snapshot", async () => {
    (api.readReplyFromCanister as jest.Mock).mockResolvedValue(null);

    await expect(
      broadcast(
        signed({
          encodedSignedCallBlob: "aa",
          encodedSignedReadStateBlob: "cc",
          requestId: "dd",
          methodName: "list_neurons",
        }),
      ),
    ).rejects.toThrow(ICPNeuronsNotRead);
    expect(api.decodeListNeuronsReply).not.toHaveBeenCalled();
  });

  it("decodes a list_neurons reply into the operation's neuron snapshot", async () => {
    (toNeuronsData as jest.Mock).mockReturnValue({ fullNeurons: [{ id: 7n }] });

    const op = await broadcast(
      signed({
        encodedSignedCallBlob: "aa",
        encodedSignedReadStateBlob: "cc",
        requestId: "dd",
        methodName: "list_neurons",
      }),
    );

    expect(api.decodeListNeuronsReply).toHaveBeenCalled();
    expect((op.extra as any).neurons).toEqual([{ id: 7n }]);
  });
});
