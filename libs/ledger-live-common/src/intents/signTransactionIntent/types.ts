import type {
  Intent,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type { SignatureRequest } from "../../flows/send/hooks/useSendFlowSignatureCore";
import type { SignedOperation } from "@ledgerhq/types-live";

/** The states every signature goes through, whatever happens when the user refuses. */
export type SignOperationProgressState =
  | { type: "pending"; deviceModelId: DeviceModelId }
  | { type: "device-signature-requested"; deviceModelId: DeviceModelId }
  | { type: "device-signature-granted"; deviceModelId: DeviceModelId }
  | { type: "device-streaming"; progress: number }
  | { type: "signed"; signedOperation: SignedOperation };

export type SignTransactionIntentJobState =
  | SignOperationProgressState
  | { type: "cancelled"; retry: () => void };

export type SignTransactionIntentInput = SignatureRequest;

export type SignTransactionIntentDefinition = IntentDefinition<
  SignTransactionIntentJobState,
  SignTransactionIntentInput
>;

export type SignTransactionIntentPlatformDefinition<ExtraProps = undefined> =
  IntentPlatformDefinition<SignTransactionIntentJobState, SignTransactionIntentInput, ExtraProps>;

export type SignTransactionIntent<ExtraProps = undefined> = Intent<
  SignTransactionIntentJobState,
  SignTransactionIntentInput,
  ExtraProps
>;
