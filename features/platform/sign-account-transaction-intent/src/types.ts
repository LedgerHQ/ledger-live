import type { SendSignEvent, SignedSend, SigningDevice } from "@domain/api-account-transaction";
import type { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { IntentDefinition, IntentPlatformDefinition } from "@features/platform-device-intent";
import type { Observable } from "rxjs";

export type SignAccountTransactionIntentInput = {
  /** `signSend(prepared)` dispatched: the source that prepared the transaction signs it. */
  readonly sign: (device: SigningDevice) => Observable<SendSignEvent>;
};

/** `signed` and `error` complete the observable; `cancelled` stays open and exposes `retry`. The observable never errors. */
export type SignAccountTransactionIntentJobState =
  | { type: "pending"; deviceModelId: DeviceModelId }
  | { type: "device-signature-requested"; deviceModelId: DeviceModelId }
  | { type: "device-streaming"; progress: number }
  | { type: "device-signature-granted" }
  | { type: "signed" }
  | { type: "cancelled"; retry: () => void }
  /** An outdated or expired preparation, a disconnection…: the flow prepares again rather than retrying. */
  | { type: "error"; error: Error };

export type SignAccountTransactionIntentDefinition = IntentDefinition<
  SignAccountTransactionIntentJobState,
  SignAccountTransactionIntentInput,
  SignedSend
>;

export type SignAccountTransactionIntentPlatformDefinition<ExtraProps = undefined> =
  IntentPlatformDefinition<
    SignAccountTransactionIntentJobState,
    SignAccountTransactionIntentInput,
    ExtraProps,
    SignedSend
  >;
