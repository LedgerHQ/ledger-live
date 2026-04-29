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
import { apiClient } from "../network/api";
import { craftTransaction } from "../logic";
import {
  createFeeTransactionIntent,
  createTransactionIntent,
  extractViewKey,
  fromHex,
  isPrivateTransaction,
  resolveConfig,
  selectPrivateTransferType,
  toHex,
} from "../logic/utils";
import { buildOptimisticOperation } from "./buildOptimisticOperation";

interface SigningParams {
  account: AleoAccount;
  transaction: Transaction;
  request: PreparedRequestResponse;
  config: ReturnType<typeof resolveConfig>;
  baseFee: BigNumber;
  priorityFee: BigNumber;
  viewKey: string;
}

async function buildRootAuthorization(
  signer: AleoSigner,
  account: AleoAccount,
  request: PreparedRequestResponse,
  viewKey: string,
) {
  const { signature } = await signer.signRootIntent(
    account.freshAddressPath,
    Buffer.from(request.tlv, "hex"),
  );

  return sdkClient.createAuthorization({
    currency: account.currency,
    request,
    signatures: signature,
    viewKey,
  });
}

async function buildFeeAuthorization(
  signer: AleoSigner,
  params: SigningParams,
  executionId: string,
): Promise<string> {
  const { account, transaction, config, baseFee, priorityFee, viewKey } = params;

  // craft fee request even if it's zero, because device needs the second APDU in signing flow to move forward
  const craftedFeeRequest = await craftTransaction({
    currency: account.currency,
    viewKey,
    feeConfiguration: null,
    txIntent: createFeeTransactionIntent({
      account,
      transaction,
      executionId,
      baseFee,
      priorityFee,
      isFeeSponsored: config.isFeeSponsored,
    }),
  });

  const feeRequest = fromHex<PreparedRequestResponse>(craftedFeeRequest.transaction);

  const { signature } = await signer.signFeeIntent(Buffer.from(feeRequest.tlv, "hex"));

  const result = await sdkClient.createAuthorization({
    currency: account.currency,
    request: feeRequest,
    signatures: signature,
    viewKey,
  });

  return result.authorization;
}

async function executeSigningFlow(signer: AleoSigner, params: SigningParams): Promise<string> {
  const { account, request, config, viewKey } = params;

  const authorization = await buildRootAuthorization(signer, account, request, viewKey);

  const feeAuthorization = config.isFeeSponsored
    ? null
    : await buildFeeAuthorization(signer, params, authorization.execution_id);

  const signedTransaction = {
    authorization: authorization.authorization,
    feeAuthorization,
  } satisfies SignedAleoTransaction;

  return toHex(signedTransaction);
}

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

          console.log("DEBUG2", transaction);

          if (
            transaction.properties?.amountRecordCommitments &&
            transaction.properties.amountRecordCommitments.length > 1
          ) {
            console.log(
              "DEBUG2",
              `Transaction with ${transaction.properties.amountRecordCommitments.length} amount record commitments`,
            );

            const unspentRecords = account.aleoResources?.unspentPrivateRecords ?? [];
            const commitments = transaction.properties.amountRecordCommitments;
            const records = commitments.map(commitment => {
              const record = unspentRecords.find(r => r.commitment === commitment);
              if (!record) {
                throw new Error(`Could not find record for commitment: ${commitment}`);
              }
              return record.decryptedData;
            });

            const intentResponse = await apiClient.createTransferIntent({
              intent: {
                type: selectPrivateTransferType(records.length),
                amount: transaction.amount.toString(),
                to: transaction.recipient,
                records,
              },
              viewKey,
              fee: {
                max_base_fee: baseFee.toString(),
                max_priority_fee: priorityFee.toString(),
                function_name: "fee_private",
              },
            });

            console.log("DEBUG2 intentResponse", intentResponse);

            const authorizationResponse = await apiClient.createAuthorization({
              request: intentResponse,
              signatures: "",
              viewKey,
              tlvVersion: 1,
            });

            console.log("DEBUG2 authorizationResponse", authorizationResponse);

            const signedTx = toHex({
              authorization: JSON.stringify(authorizationResponse.authorization),
              feeAuthorization: null,
            } satisfies SignedAleoTransaction);

            o.next({ type: "device-signature-granted" });

            const operation = buildOptimisticOperation({ account, transaction });

            o.next({
              type: "signed",
              signedOperation: { operation, signature: signedTx },
            });

            o.complete();
            return;
          } else {
            const craftedRequest = await craftTransaction({
              currency: account.currency,
              viewKey,
              feeConfiguration,
              txIntent: createTransactionIntent({ account, transaction }),
            });
            const request = fromHex<PreparedRequestResponse>(craftedRequest.transaction);
            const signedTx = await signerContext(deviceId, signer =>
              executeSigningFlow(signer, {
                account,
                transaction,
                request,
                config,
                baseFee,
                priorityFee,
                viewKey,
              }),
            );
            o.next({ type: "device-signature-granted" });

            const operation = buildOptimisticOperation({ account, transaction });

            o.next({
              type: "signed",
              signedOperation: { operation, signature: signedTx },
            });

            o.complete();
            return;
          }

          throw new Error("Standard signing flow not yet enabled — only multi-record path active");
        } catch (err) {
          o.error(err);
        }
      })();
    });
