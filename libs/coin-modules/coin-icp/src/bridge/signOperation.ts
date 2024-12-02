import { Observable } from "rxjs";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import { getAddress } from "./bridgeHelpers/addresses";
import {
  getTxnExpirationDate,
  getTxnMetadata,
  getUnsignedTransaction,
} from "./bridgeHelpers/icpRosetta";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { Transaction } from "../types";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { ICPSigner } from "../types";
import { ICP_SEND_TXN_TYPE } from "../consts";

export const buildSignOperation =
  (signerContext: SignerContext<ICPSigner>): AccountBridge<Transaction, Account>["signOperation"] =>
  ({ account, transaction, deviceId }) =>
    new Observable(o => {
      async function main() {
        // log("debug", "[signOperation] start fn");

        const { derivationPath } = getAddress(account);
        const { unsignedTxn } = await getUnsignedTransaction(transaction, account);

        o.next({
          type: "device-signature-requested",
        });

        // Sign by device
        const { r } = await signerContext(deviceId, async signer => {
          const r = await signer.sign(derivationPath, unsignedTxn, ICP_SEND_TXN_TYPE);
          return { r };
        });

        // const { signedTxn } = await signICPTransaction({
        //   unsignedTxn,
        //   transport,
        //   path: getPath(derivationPath),
        //   payloads,
        //   pubkey: xpub ?? "",
        // });

        o.next({
          type: "device-signature-granted",
        });

        // build signature on the correct format
        const signature = `${Buffer.from(r.signature_compact).toString("base64")}`;

        const { hash } = await getTxnMetadata(signature);
        const operation = await buildOptimisticOperation(account, transaction, hash);

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature,
            expirationDate: getTxnExpirationDate(unsignedTxn),
          },
        });
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });
