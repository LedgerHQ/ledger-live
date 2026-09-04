import { Cbor, requestIdOf } from "@dfinity/agent";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { AccountBridge, DeviceId, OperationType } from "@ledgerhq/types-live";
import invariant from "invariant";
import { Observable } from "rxjs";
import {
  createReadStateRequest,
  createUnsignedListNeuronsTransaction,
  createUnsignedNeuronCommandTransaction,
} from "../logic/buildNeuronTransaction";
import { createUnsignedSendTransaction, type UnsignedTransaction } from "../logic/buildTransaction";
import { pubkeyToDer } from "../logic/crypto";
import { hashTransaction } from "../logic/hashTransaction";
import { ICPSigner, ICPTransactionType, TRANSFER_TYPES, Transaction } from "../types";
import { getAddress } from "./bridgeHelpers/addresses";
import { buildOptimisticOperation } from "./buildOptimisticOperation";

// Optimistic operation type per transaction. Only ledger-canister transfers are listed; a governance
// call falls through to NONE, marking an operation that must stay out of account history — it moves
// no ICP and its hash is an IC request id no explorer resolves. The operation is still built: it is
// what carries the neuron snapshot back from broadcast.
const OPERATION_TYPE: Partial<Record<ICPTransactionType, OperationType>> = {
  send: "OUT",
  create_neuron: "STAKE_NEURON",
  increase_stake: "TOP_UP_NEURON",
};

const toHex = (bytes: ArrayBuffer | Uint8Array): string =>
  Buffer.from(bytes as Uint8Array).toString("hex");

// Assemble the CBOR envelope submitted to the replica: signed content + DER pubkey + raw signature.
const signedEnvelope = (
  content: UnsignedTransaction | object,
  xpub: string,
  senderSig: Buffer,
): string =>
  toHex(Cbor.encode({ content, sender_pubkey: pubkeyToDer(xpub), sender_sig: senderSig }));

export const buildSignOperation =
  (signerContext: SignerContext<ICPSigner>): AccountBridge<Transaction>["signOperation"] =>
  ({ account, transaction, deviceId }) =>
    new Observable(o => {
      async function main() {
        const { xpub } = account;
        invariant(xpub, "[ICP](signOperation) Account xpub is required");
        const { address, derivationPath } = getAddress(account);

        o.next({ type: "device-signature-requested" });

        const rawData = TRANSFER_TYPES.has(transaction.type)
          ? await signTransfer(transaction, address, derivationPath, xpub, signerContext, deviceId)
          : await signGovernanceCall(transaction, derivationPath, xpub, signerContext, deviceId);

        o.next({ type: "device-signature-granted" });

        const operation = await buildOptimisticOperation(
          account,
          transaction,
          rawData.hash,
          OPERATION_TYPE[transaction.type] ?? "NONE",
        );
        o.next({
          type: "signed",
          signedOperation: { operation, signature: rawData.signature, rawData: rawData.data },
        });
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });

// ICP ledger-canister transfer path. `stake` marks the transfer as a neuron creation (governance subaccount).
async function signTransfer(
  transaction: Transaction,
  senderAddress: string,
  derivationPath: string,
  xpub: string,
  signerContext: SignerContext<ICPSigner>,
  deviceId: DeviceId,
) {
  const { unsignedTransaction, transferRawRequest } = createUnsignedSendTransaction(
    transaction,
    xpub,
  );
  const blob = Cbor.encode({ content: unsignedTransaction });

  const signatures = await signerContext(deviceId, signer =>
    signer.sign(derivationPath, Buffer.from(blob), transaction.type === "create_neuron"),
  );
  invariant(signatures.signatureRS, "[ICP](signOperation) Signature not found");

  // Reproduces the on-chain ledger transaction identity; `from` is the sender, matching mapTxToOps
  // (the neuron account is the transfer `to`), so the optimistic op reconciles with the confirmed one.
  const hash = hashTransaction({
    from: senderAddress,
    to: transaction.recipient,
    amount: transferRawRequest.amount.e8s,
    fee: transferRawRequest.fee.e8s,
    memo: transferRawRequest.memo,
    created_at_time: transferRawRequest.created_at_time[0].timestamp_nanos,
  });

  return {
    signature: toHex(signatures.signatureRS),
    hash,
    data: {
      encodedSignedCallBlob: signedEnvelope(unsignedTransaction, xpub, signatures.signatureRS),
      transferRequestIdHex: toHex(requestIdOf(unsignedTransaction)),
      methodName: transaction.type,
      // The nonce broadcast passes to claim_or_refresh (distinct from the transfer memo, which is
      // 0 for a top-up so sync classifies it TOP_UP_NEURON, not STAKE_NEURON).
      stakeNonce: transaction.stakeNonce,
      neuronId: transaction.neuronId,
    },
  };
}

// Governance update-call path (manage_neuron, list_neurons): sign the call + its companion
// read-state request.
async function signGovernanceCall(
  transaction: Transaction,
  derivationPath: string,
  xpub: string,
  signerContext: SignerContext<ICPSigner>,
  deviceId: DeviceId,
) {
  const unsignedTransaction =
    transaction.type === "list_neurons"
      ? createUnsignedListNeuronsTransaction(xpub)
      : createUnsignedNeuronCommandTransaction(transaction, xpub);
  const { readStateContent, requestId } = createReadStateRequest(unsignedTransaction);

  const signatures = await signerContext(deviceId, signer =>
    signer.signUpdateCall(
      derivationPath,
      Buffer.from(Cbor.encode({ content: unsignedTransaction })),
      Buffer.from(Cbor.encode({ content: readStateContent })),
    ),
  );
  invariant(
    signatures.requestSignatureRS && signatures.readStateSignatureRS,
    "[ICP](signOperation) Update-call signatures not found",
  );

  const requestIdHex = toHex(requestId);
  return {
    signature: requestIdHex,
    hash: requestIdHex,
    data: {
      encodedSignedCallBlob: signedEnvelope(
        unsignedTransaction,
        xpub,
        signatures.requestSignatureRS,
      ),
      encodedSignedReadStateBlob: signedEnvelope(
        readStateContent,
        xpub,
        signatures.readStateSignatureRS,
      ),
      requestId: requestIdHex,
      methodName: transaction.type,
      neuronId: transaction.neuronId,
    },
  };
}
