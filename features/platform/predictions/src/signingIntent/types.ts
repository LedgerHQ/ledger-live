import type { DeviceModelId } from "@ledgerhq/device-management-kit";
import type {
  DeviceConnectionResult,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";
import type { Observable } from "rxjs";
import type { PredictionsTypedData } from "../typedData";

export type PredictionsSigningPurpose = "binding" | "order";

/** The device asks the user to confirm, once its context is loaded, then signs. */
export type PredictionsSigningEvent =
  | { type: "awaiting-confirmation" }
  | { type: "signed"; signature: string };

/** Host-injected, on the Ethereum app the executor opened. A device failure is an error. */
export type SignPredictionsTypedData = (
  connection: DeviceConnectionResult,
  typedData: PredictionsTypedData,
) => Observable<PredictionsSigningEvent>;

export type PredictionsSigningIntentInput = {
  readonly purpose: PredictionsSigningPurpose;
  /** The account's address, which the signature must recover to. */
  readonly address: string;
  readonly typedData: PredictionsTypedData;
  readonly signTypedData: SignPredictionsTypedData;
};

/** How the signature ended, reported once through `onResult`. */
export type PredictionsSigningResult =
  | { type: "signed"; signature: string }
  | { type: "mismatch"; error: Error }
  | { type: "expired"; error: Error };

/** `isAwaitingConfirmation` once the device asks the user; completes once the signature ends. */
export type PredictionsSigningJobState =
  | {
      type: "signing";
      deviceModelId: DeviceModelId;
      deviceName: string;
      isAwaitingConfirmation: boolean;
    }
  | { type: "error"; error: Error; retry: () => void }
  | { type: "mismatch" };

export type PredictionsSigningPrompt = Readonly<{ purpose: PredictionsSigningPurpose }>;

export type PredictionsSigningIntentDefinition = IntentDefinition<
  PredictionsSigningJobState,
  PredictionsSigningIntentInput,
  PredictionsSigningResult
>;

export type PredictionsSigningIntentPlatformDefinition = IntentPlatformDefinition<
  PredictionsSigningJobState,
  PredictionsSigningIntentInput,
  PredictionsSigningPrompt,
  PredictionsSigningResult
>;
