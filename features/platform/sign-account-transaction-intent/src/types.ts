import type { SigningDevice, TransactionSignEvent } from "@domain/api-account-transaction";
import type { SignedTransaction } from "@domain/entity-account-transaction";
import type { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { IntentDefinition, IntentPlatformDefinition } from "@features/platform-device-intent";
import type { Observable } from "rxjs";

export type SignAccountTransactionIntentInput = {
  /** `signSend(prepared)` dispatched: the source that prepared the transaction signs it. */
  readonly sign: (device: SigningDevice) => Observable<TransactionSignEvent>;
};

/** `signed` completes the observable; `cancelled` stays open and exposes `retry`. Other failures are observable errors. */
export type SignAccountTransactionIntentJobState =
  | { type: "pending"; deviceModelId: DeviceModelId }
  | { type: "device-signature-requested"; deviceModelId: DeviceModelId }
  | { type: "device-streaming"; progress: number }
  | { type: "device-signature-granted" }
  | { type: "signed" }
  | { type: "cancelled"; retry: () => void };

export type SignAccountTransactionIntentDefinition = IntentDefinition<
  SignAccountTransactionIntentJobState,
  SignAccountTransactionIntentInput,
  SignedTransaction
>;

export type SignAccountTransactionIntentPlatformDefinition<ExtraProps = undefined> =
  IntentPlatformDefinition<
    SignAccountTransactionIntentJobState,
    SignAccountTransactionIntentInput,
    ExtraProps,
    SignedTransaction
  >;
