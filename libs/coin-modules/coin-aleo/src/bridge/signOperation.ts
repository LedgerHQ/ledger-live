import BigNumber from "bignumber.js";
import { Observable } from "rxjs";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import {
  type Transaction,
  type AleoSigner,
  type AleoAccount,
  type SignedAleoTransaction,
  type FeeConfiguration,
  PreparedRequestResponse,
} from "../types";
import { sdkClient } from "../network/sdk";
import { craftTransaction } from "../logic";
import {
  createFeeTransactionIntent,
  createTransactionIntent,
  extractViewKey,
  fromHex,
  isPrivateTransaction,
  resolveConfig,
  toHex,
} from "../logic/utils";
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

          const viewKey = extractViewKey(account);
          const config = resolveConfig(account.currency.id);
          const baseFee = transaction.fees;
          const priorityFee = new BigNumber(0);

          const feeConfiguration: FeeConfiguration = {
            function_name: isPrivateTransaction(transaction) ? "fee_private" : "fee_public",
            max_base_fee: baseFee.toString(),
            max_priority_fee: priorityFee.toString(),
          };

          const craftedRequest = await craftTransaction({
            currency: account.currency,
            viewKey,
            feeConfiguration,
            txIntent: createTransactionIntent({ account, transaction }),
          });

          const request = fromHex<PreparedRequestResponse>(craftedRequest.transaction);

          const signedTx = await signerContext(deviceId, async signer => {
            // sign root request
            const rootIntentSignature = await signer.signRootIntent(
              account.freshAddressPath,
              Buffer.from(request.tlv, "hex"),
            );

            // create authorization
            const authorization = await sdkClient.createAuthorization({
              currency: account.currency,
              request,
              signatures: rootIntentSignature.signature,
              viewKey,
            });

            // craft fee request even if it's zero, because device needs the second APDU in signing flow to move forward
            const craftedFeeRequest = await craftTransaction({
              currency: account.currency,
              viewKey,
              feeConfiguration: null,
              txIntent: createFeeTransactionIntent({
                account,
                transaction,
                executionId: authorization.execution_id,
                baseFee,
                priorityFee,
              }),
            });

            const feeRequest = fromHex<PreparedRequestResponse>(craftedFeeRequest.transaction);

            // sign fee request
            const feeIntentSignature = await signer.signFeeIntent(
              Buffer.from(feeRequest.tlv, "hex"),
            );

            // create fee authorization, but only if fee is not zero
            let feeAuthorization: string | null = null;

            if (!config.isFeeSponsored) {
              const result = await sdkClient.createAuthorization({
                currency: account.currency,
                request: feeRequest,
                signatures: feeIntentSignature.signature,
                viewKey,
              });

              feeAuthorization = result.authorization;
            }

            const signedTransaction = {
              authorization: authorization.authorization,
              feeAuthorization,
            } satisfies SignedAleoTransaction;

            return toHex(signedTransaction);
          });

          o.next({
            type: "device-signature-granted",
          });

          const operation = buildOptimisticOperation({
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
