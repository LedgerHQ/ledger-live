import { Observable } from "rxjs";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { AssetInfo, FeeEstimation } from "@ledgerhq/coin-framework/api/types";
import type { SignerContext } from "@ledgerhq/coin-framework/signer";
import invariant from "invariant";
import type { Transaction, AleoSigner, AleoAccount } from "../types";
import { sdkClient } from "../network/sdk";
import { SignedAleoTransaction, serializeTransaction } from "../logic/utils";
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

          const asset: AssetInfo = {
            type: "native",
          };

          const accountAddress = account.freshAddress;
          const customFees: FeeEstimation = {
            value: BigInt(transaction.fees.toString()),
          };

          // TODO: craftTransacton
          // TODO: sign with device
          const signedTx = await signerContext(deviceId, async signer => {
            console.log("signOperation - starting flow");

            // 0. get keys
            const keys = await sdkClient.getDevKeys({
              currency: account.currency,
            });
            const viewKey = keys.view_key;
            const computeKey = keys.compute_key;

            console.log("signOperation - keys", keys);
            invariant(transaction.recipient !== keys.address, "aleo: self transfer error");

            // 1. create transaction request from intent
            const request = await sdkClient.createRequestFromIntent({
              currency: account.currency,
              viewKey,
              intent: {
                type: "transfer_public",
                amount: transaction.amount.toString(),
                to: transaction.recipient,
              },
            });

            console.log("signOperation - request", request);

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

            console.log("signOperation - authorization", authorization);

            // 4. create fee request
            const feeRequest = await sdkClient.createRequestFromIntent({
              currency: account.currency,
              viewKey,
              intent: {
                type: "fee_public",
                base_fee: customFees.value.toString(),
                priority_fee: "0",
                execution_id: authorization.execution_id,
              },
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

            console.log("signOperation - fee authorization", feeAuthorization);

            const signedTransaction = {
              authorization: JSON.parse(authorization.authorization),
              feeAuthorization: JSON.parse(feeAuthorization.authorization),
            } satisfies SignedAleoTransaction;

            // FIXME: just for testing, so we can confirm something before broadcasting
            await signer.getViewKey(account.freshAddressPath);

            return serializeTransaction(signedTransaction);
          });

          o.next({
            type: "device-signature-granted",
          });

          const operation = await buildOptimisticOperation({
            account,
            transaction,
          });

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
