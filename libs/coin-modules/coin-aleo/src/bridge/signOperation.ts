import { Observable } from "rxjs";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { FeeEstimation } from "@ledgerhq/coin-framework/api/types";
import type { SignerContext } from "@ledgerhq/coin-framework/signer";
import invariant from "invariant";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import type { Transaction, AleoSigner, AleoAccount } from "../types";
import { sdkClient } from "../network/sdk";
import {
  SignedAleoTransaction,
  createFeeIntent,
  mapTransactionToIntent,
  serializeTransaction,
} from "../logic/utils";
import { TRANSACTION_TYPE } from "../constants";
import { buildOptimisticOperation } from "./buildOptimisticOperation";

export const buildSignOperation =
  (
    signerContext: SignerContext<AleoSigner>,
  ): AccountBridge<Transaction, AleoAccount>["signOperation"] =>
  ({ account, transaction, deviceId }) =>
    new Observable(o => {
      void (async function () {
        try {
          o.next({
            type: "device-signature-requested",
          });

          const customFees: FeeEstimation = {
            value: BigInt(transaction.fees.toString()),
          };

          console.log("signOperation - starting flow", { transaction, account });

          // 0. get keys
          const keys = await sdkClient.getDevKeys({ currency: account.currency });
          const viewKey = keys.view_key;
          const computeKey = keys.compute_key;
          console.log("signOperation - keys", keys);

          // self transfer is allowed only for convert transactions
          if (
            transaction.type !== TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE &&
            transaction.type !== TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC
          ) {
            invariant(transaction.recipient !== keys.address, "aleo: self transfer error");
          }

          // TODO: craftTransacton
          // TODO: sign with device
          const signedTx = await signerContext(deviceId, async signer => {
            // 1. create transaction request from intent
            const intent = mapTransactionToIntent(transaction);
            const request = await sdkClient.createRequestFromIntent({
              currency: account.currency,
              viewKey,
              intent,
            });
            console.log("signOperation - request", { intent, request });

            // 2. sign transaction request
            const signatures = await sdkClient.devSign({
              currency: account.currency,
              request,
            });
            console.log("signOperation - sign request", signatures);

            // 3. create authorization
            const authorization = await sdkClient.createAuthorization({
              currency: account.currency,
              request,
              signatures,
              viewKey,
              computeKey,
            });
            if (!authorization.authorization) {
              console.warn("signOperation - authorization failed", authorization);
              throw new Error("aleo: failed authorization creation");
            }
            console.log("signOperation - authorization", authorization);

            // 4. create fee request
            const feeIntent = createFeeIntent({
              transaction,
              baseFee: customFees.value,
              executionId: authorization.execution_id,
            });
            const feeRequest = await sdkClient.createRequestFromIntent({
              currency: account.currency,
              viewKey,
              intent: feeIntent,
            });
            console.log("signOperation - fee request", feeRequest);

            // 5. sign fee request
            const feeSignatures = await sdkClient.devSign({
              currency: account.currency,
              request: feeRequest,
            });
            console.log("signOperation - fee signatures", feeSignatures);

            // 6. create fee authorization
            const feeAuthorization = await sdkClient.createAuthorization({
              currency: account.currency,
              request: feeRequest,
              signatures: feeSignatures,
              viewKey,
              computeKey,
            });
            if (!feeAuthorization.authorization) {
              console.warn("signOperation - feeAuthorization failed", feeAuthorization);
              throw new Error("aleo: failed feeAuthorization creation");
            }
            console.log("signOperation - fee authorization", feeAuthorization);

            const signedTransaction = {
              authorization: authorization.authorization,
              feeAuthorization: feeAuthorization.authorization,
            } satisfies SignedAleoTransaction;

            console.log("signOperation - signed transaction", signedTransaction);

            // FIXME: just for testing, so we can confirm something before broadcasting
            const result = await signer.getViewKey(account.freshAddressPath);
            if (result.byteLength === 0) {
              throw new UserRefusedOnDevice();
            }

            return serializeTransaction(signedTransaction);
          });

          o.next({
            type: "device-signature-granted",
          });

          const operation = await buildOptimisticOperation({
            account,
            transaction,
          });

          console.log("signOperation - optimistic operation", operation);

          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature: signedTx,
            },
          });

          o.complete();
        } catch (err) {
          o.error(err);
        }
      })();
    });
