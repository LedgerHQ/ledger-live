import type {
  DeviceIntentExecutorProps,
  Intent,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";
import type {
  ContactIntentResult,
  EditExternalAddressIdentifierIntentInput,
  EditExternalAddressIdentifierJobState,
  EditExternalAddressIdentifierResult,
  EditExternalAddressIntentInput,
  EditExternalAddressJobState,
  EditExternalAddressResult,
  EditExternalAddressScopeIntentInput,
  EditExternalAddressScopeJobState,
  EditExternalAddressScopeResult,
  RegisterExternalAddressIntentInput,
  RegisterExternalAddressJobState,
  RegisterExternalAddressResult,
  RenameContactIntentInput,
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
  | EditExternalAddressIdentifierJobState
  | EditExternalAddressScopeJobState
  | EditExternalAddressJobState;

export type ContactDeviceIntentInput =
  | RegisterExternalAddressIntentInput
  | RenameContactIntentInput
  | EditExternalAddressIdentifierIntentInput
  | EditExternalAddressScopeIntentInput
  | EditExternalAddressIntentInput;

export type ContactDeviceIntentResult =
  | ContactIntentResult<RegisterExternalAddressResult>
  | ContactIntentResult<RenameContactResult>
  | ContactIntentResult<EditExternalAddressIdentifierResult>
  | ContactIntentResult<EditExternalAddressScopeResult>
  | ContactIntentResult<EditExternalAddressResult>;

export type ContactDeviceIntent = Intent<
  ContactDeviceIntentJobState,
  ContactDeviceIntentInput,
  undefined,
  ContactDeviceIntentResult
>;

export type ContactsDeviceIntentExecutorProps = DeviceIntentExecutorProps<
  ContactDeviceIntentJobState,
  ContactDeviceIntentInput,
  undefined,
  ContactsDeviceInitializationInput,
  ContactDeviceIntentResult
>;

export type ContactOperation<JobState, Input, IntentResult, Result> = Readonly<{
  intentDefinition: IntentPlatformDefinition<JobState, Input, undefined, IntentResult>;
  intentInput: Input;
  initializationInput: ContactsDeviceInitializationInput;
  mapIntentResultToResult: (result: IntentResult) => Result;
}>;
