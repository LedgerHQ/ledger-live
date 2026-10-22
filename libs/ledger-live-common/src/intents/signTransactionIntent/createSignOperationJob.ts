import type { DeviceConnectionResult, Job } from "@features/platform-device-intent";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { getMainAccount } from "../../account/index";
import { getAccountBridge } from "../../bridge/index";
import { sendFeatures } from "../../bridge/descriptor/send/features";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type {
  Account,
  AccountLike,
  SignOperationEvent,
  SignedOperation,
} from "@ledgerhq/types-live";
import { Observable, type Subscription } from "rxjs";
import type { SignOperationProgressState, SignTransactionIntentJobState } from "./types";

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

/**
 * What a signature job does once the outcome is known, so callers choose between a retryable
 * refusal and a terminal one without duplicating the signing flow.
 */
type SignOutcome<State, Result> = Readonly<{
  /** The state emitted when the user refuses on the device. */
  refused: (retry: () => void) => State;
  /** Whether a refusal closes the job instead of leaving it open for `retry`. */
  endOnRefusal: boolean;
  /** Turns a signing failure into a state. Without it, the failure is an observable error. */
  failed?: (error: Error) => State;
  /**
   * Reports how the signature ended, once, right before the matching state. Without it the job
   * reports nothing.
   */
  results?: Readonly<{
    signed: (signedOperation: SignedOperation) => Result;
    refused: () => Result;
    failed: (error: Error) => Result;
  }>;
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
): SignOperationProgressState | null {
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

function runSignOperationJob<
  Input extends SignOperationJobInput,
  State extends { type: string },
  Result,
>(
  { getRefusalCurrency, sign }: CreateSignOperationJobParams<Input>,
  outcome: SignOutcome<State, Result>,
  {
    deviceConnectionResult,
    input,
    onResult,
  }: Readonly<{
    deviceConnectionResult: DeviceConnectionResult;
    input: Input;
    onResult: (result: Result) => void;
  }>,
): Observable<SignOperationProgressState | State> {
  const device = buildSigningDevice(deviceConnectionResult);
  const mainAccount = getMainAccount(input.account, input.parentAccount ?? undefined);
  const currency = getRefusalCurrency(mainAccount, input);

  return new Observable<SignOperationProgressState | State>(subscriber => {
    let innerSubscription: Subscription | undefined;
    let runRequestId = 0;

    const fail = (error: unknown) => {
      const normalized = normalizeSignError(error);
      if (outcome.results) onResult(outcome.results.failed(normalized));
      if (outcome.failed) {
        subscriber.next(outcome.failed(normalized));
        subscriber.complete();
        return;
      }
      subscriber.error(normalized);
    };

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
              if (!state) return;
              if (state.type === "signed" && outcome.results) {
                onResult(outcome.results.signed(state.signedOperation));
              }
              subscriber.next(state);
            },
            // A user refusal is a terminal but non-error outcome: surface a dedicated
            // state (info screen) instead of letting the error escape the observable, which
            // would otherwise trigger the executor's generic error screen.
            error: error => {
              if (isUserRefusalError(error, currency)) {
                if (outcome.results) onResult(outcome.results.refused());
                subscriber.next(outcome.refused(run));
                if (outcome.endOnRefusal) subscriber.complete();
                return;
              }
              fail(error);
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

          fail(error);
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
  return jobInput =>
    runSignOperationJob<Input, SignTransactionIntentJobState, undefined>(
      params,
      { refused: retry => ({ type: "cancelled", retry }), endOnRefusal: false },
      jobInput,
    );
}

/** How a terminal signature job reports its end through `onResult`. */
export type TerminalSignOperationResult =
  | Readonly<{ status: "signed"; signedOperation: SignedOperation }>
  | Readonly<{ status: "refused" }>
  | Readonly<{ status: "failed"; error: Error }>;

/** What a terminal signature job ends on, besides `signed`. */
export type TerminalSignOperationState =
  | SignOperationProgressState
  | { type: "refused" }
  | { type: "error"; error: Error };

/**
 * Like {@link createSignOperationJob}, but the job always ends: a refusal is a final `refused`
 * state without a retry and a failure is a final `error` state. Every end is also reported as the
 * job's result. For flows that cannot sign twice, such as an exchange whose Exchange app
 * has already handed over to the coin app.
 */
export function createTerminalSignOperationJob<Input extends SignOperationJobInput>(
  params: CreateSignOperationJobParams<Input>,
): Job<TerminalSignOperationState, Input, TerminalSignOperationResult> {
  return jobInput =>
    runSignOperationJob<Input, TerminalSignOperationState, TerminalSignOperationResult>(
      params,
      {
        refused: () => ({ type: "refused" }),
        endOnRefusal: true,
        failed: error => ({ type: "error", error }),
        results: {
          signed: signedOperation => ({ status: "signed", signedOperation }),
          refused: () => ({ status: "refused" }),
          failed: error => ({ status: "failed", error }),
        },
      },
      jobInput,
    );
}
