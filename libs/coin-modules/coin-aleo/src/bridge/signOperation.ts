import BigNumber from "bignumber.js";
import { Observable } from "rxjs";
import type { AccountBridge } from "@ledgerhq/types-live";
import type {
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/types";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import {
  type Transaction,
  type AleoSigner,
  type AleoAccount,
  type SignedAleoTransaction,
  type FeeConfiguration,
  PreparedRequestResponse,
  type AleoCoinConfig,
  AleoTransactionIntentData,
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

type DeviceStreamingCallback = (arg0: { progress: number; total: number; index: number }) => void;

function createStreamingReporter(
  onDeviceStreaming: DeviceStreamingCallback,
  total: number,
): {
  reportInitialStep: () => void;
  reportStepCompleted: () => void;
} {
  let completedSteps = 0;
  return {
    reportInitialStep: () => {
      onDeviceStreaming({ total, index: 0, progress: 0.01 }); // show 1% to indicate that the initial step is in progress
    },
    reportStepCompleted: () => {
      completedSteps += 1;
      const index = completedSteps - 1;
      const progress = completedSteps / total;
      onDeviceStreaming({ total, index, progress });
    },
  };
}

async function getTvks({
  signer,
  path,
  txIntent,
  isCancelled,
  onDeviceStreaming,
}: {
  signer: AleoSigner;
  path: string;
  txIntent: TransactionIntent<MemoNotSupported, AleoTransactionIntentData>;
  isCancelled: () => boolean;
  onDeviceStreaming: DeviceStreamingCallback;
}): Promise<{
  rootTvk: string;
  nestedTvks: string[];
  // feeTvk: string; // not used on the backend side, left just for documentation purposes
} | null> {
  const records = "data" in txIntent && "records" in txIntent.data ? txIntent.data.records : null;
  const isTxWithNestedCalls = records && records.length > 1;

  // TVKs are only needed for transactions with nested calls.
  // In our case it can happen only when more than 1 record is used
  if (!isTxWithNestedCalls) {
    return null;
  }

  const nestedTvks: string[] = [];
  const tvksToFetch = records.length + 1;
  const streamingReporter = createStreamingReporter(onDeviceStreaming, tvksToFetch);

  streamingReporter.reportInitialStep();

  if (isCancelled()) return null;

  const rootResult = await signer.getTvk(path);
  const rootTvk = Buffer.from(rootResult.tvk).toString("hex");
  streamingReporter.reportStepCompleted();

  for (let transitionIndex = 1; transitionIndex < tvksToFetch; transitionIndex++) {
    if (isCancelled()) return null;
    const nestedResult = await signer.getTvk(path, transitionIndex);
    nestedTvks.push(Buffer.from(nestedResult.tvk).toString("hex"));
    streamingReporter.reportStepCompleted();
  }

  return { rootTvk, nestedTvks };
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
          const txIntent = createTransactionIntent({ account, transaction });
          const baseFee = transaction.fees;
          const priorityFee = new BigNumber(0);

          const feeConfiguration: FeeConfiguration = {
            function_name: isPrivateTransaction(transaction) ? "fee_private" : "fee_public",
            max_base_fee: baseFee.toString(),
            max_priority_fee: priorityFee.toString(),
          };

          const signature = await signerContext(deviceId, async signer => {
            const tvks = await getTvks({
              signer,
              path: account.freshAddressPath,
              txIntent,
              isCancelled: () => o.closed,
              onDeviceStreaming: ({ progress, index, total }) => {
                o.next({
                  type: "device-streaming",
                  progress,
                  index,
                  total,
                });
              },
            });

            if (o.closed) return;

            const craftedRequest = await craftTransaction({
              currency: account.currency,
              viewKey,
              feeConfiguration,
              txIntent,
              ...(tvks && { tvks: [tvks.rootTvk, ...tvks.nestedTvks] }),
            });

            const request = fromHex<PreparedRequestResponse>(craftedRequest.transaction);

            if (o.closed) return;

            o.next({
              type: "device-signature-requested",
            });

            return executeSigningFlow({
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
            });
          });

          if (!signature) return;

          const operation = buildOptimisticOperation({
            account,
            transaction,
          });

          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature,
            },
          });

          o.complete();
        } catch (err) {
          o.error(err);
        }
      })();
    });
