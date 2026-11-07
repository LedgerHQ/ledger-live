import type { MessageSignEvent, SigningDevice } from "@domain/api-account-transaction";
import type { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { IntentDefinition, IntentPlatformDefinition } from "@features/platform-device-intent";
import type { Observable } from "rxjs";

export type SignAccountMessageIntentInput = {
  /** `signMessageSend(descriptor, messageHex)` dispatched: the source that serves the account signs. */
  readonly sign: (device: SigningDevice) => Observable<MessageSignEvent>;
};

/** `signed` completes the observable; `cancelled` stays open and exposes `retry`. Other failures are observable errors. */
export type SignAccountMessageIntentJobState =
  | { type: "pending"; deviceModelId: DeviceModelId }
  | { type: "device-signature-requested"; deviceModelId: DeviceModelId; deviceName: string }
  | { type: "signed" }
  | { type: "cancelled"; retry: () => void };

/** The signature, in hex. */
export type SignAccountMessageIntentResult = string;

export type SignAccountMessageIntentDefinition = IntentDefinition<
  SignAccountMessageIntentJobState,
  SignAccountMessageIntentInput,
  SignAccountMessageIntentResult
>;

export type SignAccountMessageIntentPlatformDefinition<ExtraProps = undefined> =
  IntentPlatformDefinition<
    SignAccountMessageIntentJobState,
    SignAccountMessageIntentInput,
    ExtraProps,
    SignAccountMessageIntentResult
  >;
