import { Observable } from "rxjs";
import { AccountBridge } from "@ledgerhq/types-live";
import { getAddress } from "./bridge/bridgeHelpers/addresses";
import {
  getTxnExpirationDate,
  getTxnMetadata,
  getUnsignedTransaction,
  signICPTransaction,
} from "./bridge/bridgeHelpers/icpRosetta";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { withDevice } from "../../hw/deviceAccess";
import { Transaction } from "./types";
import { getPath } from "./utils";

export const signOperation: AccountBridge<Transaction>["signOperation"] = ({
  account,
  deviceId,
  transaction,
}) =>
  withDevice(deviceId)(
    transport =>
      new Observable(o => {
        async function main() {
          // log("debug", "[signOperation] start fn");

          const { xpub } = account;
          const { derivationPath } = getAddress(account);
          const { unsignedTxn, payloads } = await getUnsignedTransaction(transaction, account);

          o.next({
            type: "device-signature-requested",
          });

          const { signedTxn } = await signICPTransaction({
            unsignedTxn,
            transport,
            path: getPath(derivationPath),
            payloads,
            pubkey: xpub ?? "",
          });

          o.next({
            type: "device-signature-granted",
          });

          const { hash } = await getTxnMetadata(signedTxn);
          const operation = await buildOptimisticOperation(account, transaction, hash);

          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature: signedTxn,
              expirationDate: getTxnExpirationDate(unsignedTxn),
            },
          });
        }

        main().then(
          () => o.complete(),
          e => o.error(e),
        );
      }),
  );
