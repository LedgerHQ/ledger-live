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
  type AleoCoinConfig,
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

interface SigningParams {
  account: AleoAccount;
  transaction: Transaction;
  request: PreparedRequestResponse;
  config: AleoCoinConfig;
  baseFee: BigNumber;
  priorityFee: BigNumber;
  viewKey: string;
}

async function buildFeeAuthorization({
  signer,
  params,
  executionId,
  onDeviceSigned,
}: {
  signer: AleoSigner;
  params: SigningParams;
  executionId: string;
  onDeviceSigned: () => void;
}): Promise<string> {
  const { account, transaction, config, baseFee, priorityFee, viewKey } = params;

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

  onDeviceSigned();

  const result = await sdkClient.createAuthorization({
    currency: account.currency,
    request: feeRequest,
    signatures: config.recordPickingStrategy === "manual" ? signature : [signature],
    viewKey,
  });

  return result.authorization;
}

function flattenNestedCalls(calls: PreparedRequestResponse[]): PreparedRequestResponse[] {
  return calls.flatMap(call => [call, ...flattenNestedCalls(call.nested_calls ?? [])]);
}

async function executeSigningFlow({
  signer,
  params,
  onDeviceSigned,
}: {
  signer: AleoSigner;
  params: SigningParams;
  onDeviceSigned: () => void;
}): Promise<string> {
  const { account, request, config, viewKey } = params;
  const nestedCalls = config.recordPickingStrategy === "manual" ? [] : (request.nested_calls ?? []);
  const flatNestedCalls = flattenNestedCalls(nestedCalls);
  const nestedSignatures: string[] = [];

  // sign root intent
  const { signature: rootSignature } = await signer.signRootIntent(
    account.freshAddressPath,
    Buffer.from(request.tlv, "hex"),
  );

  // sign nested calls if any
  for (const nestedCall of flatNestedCalls) {
    const { signature } = await signer.signNestedCall(Buffer.from(nestedCall.tlv, "hex"));
    nestedSignatures.push(signature);
  }

  // for sponsored txs there is no fee signing, so device is done here
  if (config.isFeeSponsored) {
    onDeviceSigned();
  }

  // manual record picking strategy is the old version that doesn't support nested calls
  const signatures =
    config.recordPickingStrategy === "manual"
      ? rootSignature
      : [rootSignature, ...nestedSignatures];

  // create authorization for main transaction
  const authorization = await sdkClient.createAuthorization({
    currency: account.currency,
    request,
    signatures,
    viewKey,
  });

  // if fee sponsorship is disabled, sign and create fee authorization
  const feeAuthorization = config.isFeeSponsored
    ? null
    : await buildFeeAuthorization({
        signer,
        params,
        executionId: authorization.execution_id,
        onDeviceSigned,
      });

  return toHex({
    authorization: authorization.authorization,
    feeAuthorization,
  } satisfies SignedAleoTransaction);
}

export const buildSignOperation =
  (
    signerContext: SignerContext<AleoSigner>,
  ): AccountBridge<Transaction, AleoAccount>["signOperation"] =>
  ({ account, transaction, deviceId }) =>
    new Observable(o => {
      void (async function () {
        try {
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

          o.next({
            type: "device-signature-requested",
          });

          const signedTx = await signerContext(deviceId, signer =>
            executeSigningFlow({
              signer,
              onDeviceSigned: () => o.next({ type: "device-signature-granted" }),
              params: {
                account,
                transaction,
                request,
                config,
                baseFee,
                priorityFee,
                viewKey,
              },
            }),
          );

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
