import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { log } from "@ledgerhq/logs";
import { Account, AccountBridge, DeviceId } from "@ledgerhq/types-live";
import { Cbor } from "@zondax/ledger-live-icp/agent";
import {
  UnsignedTransaction,
  createUnsignedSendTransaction,
  hashTransaction,
  pubkeyToDer,
} from "@zondax/ledger-live-icp/utils";
import invariant from "invariant";
import { Observable } from "rxjs";
import { getPath } from "../common-logic";
import { Transaction } from "../types";
import { ICPSigner } from "../types";
import { getAddress } from "./bridgeHelpers/addresses";
import { buildOptimisticOperation } from "./buildOptimisticOperation";

const signICPTransaction = async (
  unsignedTxn: UnsignedTransaction,
  derivationPath: string,
  signerContext: SignerContext<ICPSigner>,
  account: Account,
  deviceId: DeviceId,
) => {
  const blob = Cbor.encode({ content: unsignedTxn });
  log("debug", "[signICPTransaction] blob", Buffer.from(blob).toString("hex"));
  const signatures = await signerContext(deviceId, signer =>
    signer.sign(derivationPath, Buffer.from(blob)),
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

export const buildSignOperation =
  (signerContext: SignerContext<ICPSigner>): AccountBridge<Transaction>["signOperation"] =>
  ({ account, transaction, deviceId }) =>
    new Observable(o => {
      async function main() {
        log("debug", "[signOperation] icp start fn");
        log("debug", "[signOperation] transaction", transaction);

        const { xpub } = account;
        invariant(xpub, "[ICP](signOperation) Account xpub is required");

        const { derivationPath } = getAddress(account);

        const { unsignedTransaction, transferRawRequest } = createUnsignedSendTransaction(
          transaction,
          xpub,
        );

        o.next({
          type: "device-signature-requested",
        });

        let signature: string = "";
        let encodedSignedCallBlob: string = "";
        const res = await signICPTransaction(
          unsignedTransaction,
          getPath(derivationPath),
          signerContext,
          account,
          deviceId,
        );
        signature = res.signature;
        encodedSignedCallBlob = Buffer.from(Cbor.encode(res.callBody)).toString("hex");
        invariant(signature, "[ICP](signOperation) Signature not found");

        o.next({
          type: "device-signature-granted",
        });

        const hash = hashTransaction({
          from: account.freshAddress,
          to: transaction.recipient,
          amount: transferRawRequest.amount.e8s,
          fee: transferRawRequest.fee.e8s,
          memo: transferRawRequest.memo,
          created_at_time: transferRawRequest.created_at_time[0]["timestamp_nanos"],
        });

        const operation = await buildOptimisticOperation(account, transaction, hash);
        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature,
            rawData: {
              encodedSignedCallBlob,
            },
          },
        });
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });
