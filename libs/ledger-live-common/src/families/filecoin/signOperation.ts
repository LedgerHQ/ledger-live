import { Observable } from "rxjs";
import { log } from "@ledgerhq/logs";
import Fil from "@zondax/ledger-filecoin";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { AccountBridge, Operation, SignOperationEvent } from "@ledgerhq/types-live";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { withDevice } from "../../hw/deviceAccess";
import { toCBOR } from "./bridge/utils/serializer";
import { getAddress, getSubAccount } from "./bridge/utils/utils";
import { getPath, isError } from "./utils";
import { Transaction } from "./types";
import { close } from "../../hw";

export const signOperation: AccountBridge<Transaction>["signOperation"] = ({
  account,
  deviceId,
  transaction,
}): Observable<SignOperationEvent> =>
  withDevice(deviceId)(
    transport =>
      new Observable(o => {
        async function main() {
          // log("debug", "[signOperation] start fn");

          const { method, version, nonce, gasFeeCap, gasLimit, gasPremium } = transaction;
          const { derivationPath } = getAddress(account);
          const subAccount = getSubAccount(account, transaction);
          const tokenAccountTxn = subAccount?.type === "TokenAccount";

          if (!gasFeeCap.gt(0) || !gasLimit.gt(0)) {
            log(
              "debug",
              `signOperation missingData --> gasFeeCap=${gasFeeCap} gasLimit=${gasLimit}`,
            );
            throw new FeeNotLoaded();
          }

          const filecoin = new Fil(transport);

          try {
            o.next({
              type: "device-signature-requested",
            });

            // Serialize tx
            const toCBORResponse = await toCBOR(account, transaction);
            const {
              txPayload,
              parsedSender,
              recipientToBroadcast,
              encodedParams,
              amountToBroadcast: finalAmount,
            } = toCBORResponse;

            log("debug", `[signOperation] serialized CBOR tx: [${txPayload.toString("hex")}]`);

            // Sign by device
            const result = await filecoin.sign(getPath(derivationPath), txPayload);
            isError(result);

            o.next({
              type: "device-signature-granted",
            });

            // build signature on the correct format
            const signature = `${result.signature_compact.toString("base64")}`;

            const operation: Operation = await buildOptimisticOperation(
              account,
              transaction,
              toCBORResponse,
            );

            // Necessary for broadcast
            const additionalTxFields = {
              sender: parsedSender,
              recipient: recipientToBroadcast,
              params: encodedParams,
              gasLimit,
              gasFeeCap,
              gasPremium,
              method,
              version,
              nonce,
              signatureType: 1,
              tokenTransfer: tokenAccountTxn,
              value: finalAmount.toString(),
            };

            o.next({
              type: "signed",
              signedOperation: {
                operation,
                signature,
                rawData: additionalTxFields,
              },
            });
          } finally {
            close(transport, deviceId);

            // log("debug", "[signOperation] finish fn");
          }
        }

        main().then(
          () => o.complete(),
          e => o.error(e),
        );
      }),
  );
