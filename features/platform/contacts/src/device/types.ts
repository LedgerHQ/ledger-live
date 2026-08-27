import type { Intent, IntentPlatformDefinition } from "@features/platform-device-intent";
import type {
  ContactIntentResult,
  EditExternalAddressIntentInput,
  EditExternalAddressIntentPlatformDefinition,
  EditExternalAddressJobState,
  EditExternalAddressResult,
  RegisterExternalAddressIntentInput,
  RegisterExternalAddressIntentPlatformDefinition,
  RegisterExternalAddressJobState,
  RegisterExternalAddressResult,
  RenameContactIntentInput,
  RenameContactIntentPlatformDefinition,
  RenameContactJobState,
  RenameContactResult,
} from "./intents";

export type ContactsDeviceInitializationInput = Readonly<{
  appName: string;
  dependencies: string[];
  requireLatestFirmware: boolean;
}>;

export type ContactDeviceIntentJobState =
  | RegisterExternalAddressJobState
  | RenameContactJobState
  | EditExternalAddressJobState;

export type ContactDeviceIntentInput =
  | RegisterExternalAddressIntentInput
  | RenameContactIntentInput
  | EditExternalAddressIntentInput;

export type ContactDeviceIntentResult =
  | ContactIntentResult<RegisterExternalAddressResult>
  | ContactIntentResult<RenameContactResult>
  | ContactIntentResult<EditExternalAddressResult>;

export type ContactDeviceIntent = Intent<
  ContactDeviceIntentJobState,
  ContactDeviceIntentInput,
  undefined,
  ContactDeviceIntentResult
>;

/**
 * The platform definitions the orchestrator needs to run the Contacts device
 * operations. Each app owns its renderers, so it builds these from the shared
 * `IntentDefinition`s and injects them into
 * {@link useContactsIntentsOrchestrator}. Keys mirror the
 * {@link ContactDeviceIntentsPort} methods that consume them.
 */
export type ContactsIntentPlatformDefinitions = Readonly<{
  registerExternalAddress: RegisterExternalAddressIntentPlatformDefinition;
  renameExternalContact: RenameContactIntentPlatformDefinition;
  editExternalAddress: EditExternalAddressIntentPlatformDefinition;
}>;

export type ContactOperation<JobState, Input, IntentResult, Result> = Readonly<{
  intentDefinition: IntentPlatformDefinition<JobState, Input, undefined, IntentResult>;
  intentInput: Input;
  initializationInput: ContactsDeviceInitializationInput;
  mapIntentResultToResult: (result: IntentResult) => Result;
}>;
