import { Observable } from "rxjs";
import { Account, AccountBridge, DeviceId } from "@ledgerhq/types-live";
import { getAddress } from "./bridgeHelpers/addresses";
import { buildOptimisticSendOperation as buildOptimisticOperation } from "./buildOptimisticOperation";
import { hashTransaction, pubkeyToDer } from "@zondax/ledger-live-icp/utils";
import {
  ICPAccount,
  ICPAccountRaw,
  ICPSigner,
  InternetComputerOperation,
  Transaction,
  TransactionStatus,
} from "../types";
import { getPath } from "../common-logic/utils";
import { log } from "@ledgerhq/logs";
import invariant from "invariant";
import { Cbor } from "@zondax/ledger-live-icp/agent";
import { SignerContext } from "@ledgerhq/coin-framework/lib/signer";
import {
  UnsignedTransaction,
  TransferRawRequest,
  createReadStateRequest,
  createUnsignedSendTransaction,
  createUnsignedListNeuronsTransaction,
  createUnsignedNeuronCommandTransaction,
} from "@zondax/ledger-live-icp/utils";

const signICPTransaction = async (
  unsignedTxn: UnsignedTransaction,
  derivationPath: string,
  signerContext: SignerContext<ICPSigner>,
  account: Account,
  isCreateNeuron: boolean,
  deviceId: DeviceId,
) => {
  const blob = Cbor.encode({ content: unsignedTxn });
  log("debug", "[signICPTransaction] blob", Buffer.from(blob).toString("hex"));
  const signatures = await signerContext(deviceId, signer =>
    signer.sign(derivationPath, Buffer.from(blob), isCreateNeuron ? 1 : 0),
  );

  invariant(signatures.signatureRS, "[ICP](signICPTransaction) Signature not found");
  invariant(account.xpub, "[ICP](signICPTransaction) Account xpub is required");
  return {
    signature: Buffer.from(signatures.signatureRS).toString("hex"),
    callBody: {
      content: unsignedTxn,
      sender_pubkey: pubkeyToDer(account.xpub),
      sender_sig: signatures.signatureRS,
    },
  };
};

const signUpdateICPTransaction = async (
  unsignedTxn: UnsignedTransaction,
  derivationPath: string,
  signerContext: SignerContext<ICPSigner>,
  account: Account,
  deviceId: DeviceId,
) => {
  const { requestId, readStateBody } = await createReadStateRequest(unsignedTxn);

  const signatures = await signerContext(deviceId, signer =>
    signer.signUpdateCall(
      derivationPath,
      Buffer.from(Cbor.encode({ content: unsignedTxn })),
      Buffer.from(Cbor.encode({ content: readStateBody })),
      0,
    ),
  );

  invariant(account.xpub, "[ICP](signUpdateICPTransaction) Account xpub is required");
  invariant(
    signatures.RequestSignatureRS,
    "[ICP](signUpdateICPTransaction) Request signature not found",
  );
  invariant(
    signatures.StatusReadSignatureRS,
    "[ICP](signUpdateICPTransaction) Status read signature not found",
  );

  return {
    signature: Buffer.from(signatures.RequestSignatureRS).toString("hex"),
    requestId,
    readStateBody: {
      content: readStateBody,
      sender_pubkey: pubkeyToDer(account.xpub),
      sender_sig: signatures.StatusReadSignatureRS,
    },
    callBody: {
      content: unsignedTxn,
      sender_pubkey: pubkeyToDer(account.xpub),
      sender_sig: signatures.RequestSignatureRS,
    },
  };
};

export const buildSignOperation =
  (
    signerContext: SignerContext<ICPSigner>,
  ): AccountBridge<
    Transaction,
    ICPAccount,
    TransactionStatus,
    InternetComputerOperation,
    ICPAccountRaw
  >["signOperation"] =>
  ({ account, transaction, deviceId }) =>
    new Observable(o => {
      async function main() {
        log("debug", "[signOperation] icp start fn");
        log("debug", "[signOperation] transaction", transaction);

        invariant(account.xpub, "[ICP](signOperation) Account xpub is required");
        const { derivationPath } = getAddress(account);
        const sendTypes = ["send", "increase_stake", "create_neuron"];

        let unsignedTransaction: UnsignedTransaction;
        let transferRawRequest: TransferRawRequest | undefined;
        if (sendTypes.includes(transaction.type)) {
          ({ unsignedTransaction, transferRawRequest } = createUnsignedSendTransaction(
            transaction,
            account.xpub,
          ));
        } else if (transaction.type === "list_neurons") {
          ({ unsignedTransaction } = createUnsignedListNeuronsTransaction(account.xpub));
        } else {
          ({ unsignedTransaction } = createUnsignedNeuronCommandTransaction(
            transaction,
            account.xpub,
          ));
        }

        o.next({
          type: "device-signature-requested",
        });

        let signature: string = "";
        let encodedSignedCallBlob: string = "";
        let encodedSignedReadStateBlob: string = "";
        let requestId: string = "";
        if (sendTypes.includes(transaction.type)) {
          const res = await signICPTransaction(
            unsignedTransaction,
            getPath(derivationPath),
            signerContext,
            account,
            transaction.type === "create_neuron",
            deviceId,
          );
          signature = res.signature;
          encodedSignedCallBlob = Buffer.from(Cbor.encode(res.callBody)).toString("hex");
        } else {
          const res = await signUpdateICPTransaction(
            unsignedTransaction,
            getPath(derivationPath),
            signerContext,
            account,
            deviceId,
          );
          signature = res.signature;
          encodedSignedCallBlob = Buffer.from(Cbor.encode(res.callBody)).toString("hex");
          encodedSignedReadStateBlob = Buffer.from(Cbor.encode(res.readStateBody)).toString("hex");
          requestId = Buffer.from(res.requestId).toString("hex");
        }
        invariant(signature, "[ICP](signOperation) Signature not found");

        o.next({
          type: "device-signature-granted",
        });

        const hash = transferRawRequest
          ? hashTransaction({
              from: account.freshAddress,
              to: transaction.recipient,
              amount: transferRawRequest.amount.e8s,
              fee: transferRawRequest.fee.e8s,
              memo: transferRawRequest.memo,
              created_at_time: transferRawRequest.created_at_time[0]["timestamp_nanos"],
            })
          : undefined;

        const operation = await buildOptimisticOperation(account, transaction, hash);
        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature,
            rawData: {
              encodedSignedCallBlob,
              encodedSignedReadStateBlob,
              requestId,
              methodName: transaction.type,
              neuronId: transaction.neuronId,
            },
          },
        });
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });
