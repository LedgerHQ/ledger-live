import type { DeviceModelId } from "@ledgerhq/device-management-kit";
import type {
  DeviceConnectionResult,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";
import type { Observable } from "rxjs";
import type { PredictionsBindingAnswer, PredictionsTypedData } from "../binding";
import type { PredictionsBindingSignerMismatch } from "../errors";

/** The device asks the user to confirm, once its context is loaded, then signs. */
export type BindingSigningEvent =
  | { type: "awaiting-confirmation" }
  | { type: "signed"; signature: string };

/** Host-injected, on the Ethereum app the executor opened. A device failure is an error. */
export type SignBindingTypedData = (
  connection: DeviceConnectionResult,
  typedData: PredictionsTypedData,
) => Observable<BindingSigningEvent>;

export type PredictionsBindingIntentInput = {
  /** The account's address, which the signature must recover to. */
  readonly address: string;
  readonly signTypedData: SignBindingTypedData;
};

/** How the binding ended, reported once through `onResult`. */
export type PredictionsBindingResult =
  | { type: "bound"; answer: PredictionsBindingAnswer }
  | { type: "mismatch"; error: PredictionsBindingSignerMismatch };

/** `isAwaitingConfirmation` once the device asks the user; completes once the binding ends. */
export type PredictionsBindingJobState =
  | {
      type: "signing";
      deviceModelId: DeviceModelId;
      deviceName: string;
      isAwaitingConfirmation: boolean;
    }
  | { type: "error"; error: Error; retry: () => void }
  | { type: "mismatch" };

export type PredictionsBindingIntentDefinition = IntentDefinition<
  PredictionsBindingJobState,
  PredictionsBindingIntentInput,
  PredictionsBindingResult
>;

export type PredictionsBindingIntentPlatformDefinition = IntentPlatformDefinition<
  PredictionsBindingJobState,
  PredictionsBindingIntentInput,
  undefined,
  PredictionsBindingResult
>;
