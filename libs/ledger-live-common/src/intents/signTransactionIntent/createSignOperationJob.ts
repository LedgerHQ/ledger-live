import type { DeviceConnectionResult, Job } from "@features/platform-device-intent";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { getMainAccount } from "../../account/index";
import { getAccountBridge } from "../../bridge/index";
import { sendFeatures } from "../../bridge/descriptor/send/features";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type { Account, AccountLike, SignOperationEvent } from "@ledgerhq/types-live";
import { Observable, type Subscription } from "rxjs";
import type { SignTransactionIntentJobState } from "./types";

type SigningDevice = Readonly<{
  deviceId: string;
  modelId: DeviceModelId;
}>;

type SignOperationJobInput = Readonly<{
  account: AccountLike;
  parentAccount?: Account | null;
}>;

export type SignOperationRequest<Input> = Readonly<{
  bridge: Awaited<ReturnType<typeof getAccountBridge>>;
  mainAccount: Account;
  input: Input;
  deviceId: string;
  deviceModelId: DeviceModelId;
}>;

type CreateSignOperationJobParams<Input> = Readonly<{
  /** The currency whose coin-specific refusal errors count as a user cancel. */
  getRefusalCurrency: (mainAccount: Account, input: Input) => CryptoOrTokenCurrency;
  sign: (request: SignOperationRequest<Input>) => Observable<SignOperationEvent>;
}>;

function buildSigningDevice(connectionResult: DeviceConnectionResult): SigningDevice {
  return {
    deviceId: connectionResult.compatDeviceId,
    modelId: dmkToLedgerDeviceIdMap[connectionResult.connectedDevice.modelId],
  };
}

function isUserRefusalError(error: unknown, currency: CryptoOrTokenCurrency | undefined): boolean {
  if (sendFeatures.isUserRefusedTransactionError(currency, error)) return true;
  const { name, statusCode }: { name?: unknown; statusCode?: unknown } =
    typeof error === "object" && error !== null ? error : {};
  return (
    name === "TransactionRefusedOnDevice" ||
    name === "UserRefusedOnDevice" ||
    (name === "TransportStatusError" && statusCode === 0x6985)
  );
}

function normalizeSignError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function mapSignOperationEvent(
  event: SignOperationEvent,
  deviceModelId: DeviceModelId,
): SignTransactionIntentJobState | null {
  switch (event.type) {
    case "signed":
      return { type: "signed", signedOperation: event.signedOperation };
    case "device-signature-requested":
      return { type: "device-signature-requested", deviceModelId };
    case "device-streaming":
      return { type: "device-streaming", progress: event.progress };
    case "device-signature-granted":
      return { type: "device-signature-granted", deviceModelId };
    default:
      return null;
  }
}

function runSignOperationJob<Input extends SignOperationJobInput>(
  { getRefusalCurrency, sign }: CreateSignOperationJobParams<Input>,
  {
    deviceConnectionResult,
    input,
  }: Readonly<{
    deviceConnectionResult: DeviceConnectionResult;
    input: Input;
  }>,
): Observable<SignTransactionIntentJobState> {
  const device = buildSigningDevice(deviceConnectionResult);
  const mainAccount = getMainAccount(input.account, input.parentAccount ?? undefined);
  const currency = getRefusalCurrency(mainAccount, input);

  return new Observable<SignTransactionIntentJobState>(subscriber => {
    let innerSubscription: Subscription | undefined;
    let runRequestId = 0;

    const run = () => {
      const currentRunRequestId = ++runRequestId;
      innerSubscription?.unsubscribe();
      subscriber.next({ type: "pending", deviceModelId: device.modelId });

      getAccountBridge(mainAccount)
        .then(bridge => {
          if (subscriber.closed || currentRunRequestId !== runRequestId) {
            return;
          }

          innerSubscription = sign({
            bridge,
            mainAccount,
            input,
            deviceId: device.deviceId,
            deviceModelId: device.modelId,
          }).subscribe({
            next: event => {
              const state = mapSignOperationEvent(event, device.modelId);
              if (state) {
                subscriber.next(state);
              }
            },
            // A user refusal is a terminal but non-error outcome: surface a dedicated
            // "cancelled" state (info screen + retry) instead of letting the error escape
            // the observable, which would otherwise trigger the executor's generic error screen.
            error: error => {
              if (isUserRefusalError(error, currency)) {
                subscriber.next({ type: "cancelled", retry: run });
                return;
              }
              subscriber.error(normalizeSignError(error));
            },
            complete: () => {
              subscriber.complete();
            },
          });
        })
        .catch(error => {
          if (subscriber.closed || currentRunRequestId !== runRequestId) {
            return;
          }

          subscriber.error(normalizeSignError(error));
        });
    };

    run();

    return () => {
      runRequestId += 1;
      innerSubscription?.unsubscribe();
    };
  });
}

export function createSignOperationJob<Input extends SignOperationJobInput>(
  params: CreateSignOperationJobParams<Input>,
): Job<SignTransactionIntentJobState, Input> {
  return jobInput => runSignOperationJob(params, jobInput);
}
