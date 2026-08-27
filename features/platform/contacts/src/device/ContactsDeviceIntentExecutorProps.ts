import type { DeviceIntentExecutorProps } from "@features/platform-device-intent";
import type {
  ContactDeviceIntentInput,
  ContactDeviceIntentJobState,
  ContactDeviceIntentResult,
  ContactsDeviceInitializationInput,
} from "./types";

export type ContactsDeviceIntentExecutorProps = DeviceIntentExecutorProps<
  ContactDeviceIntentJobState,
  ContactDeviceIntentInput,
  undefined,
  ContactsDeviceInitializationInput,
  ContactDeviceIntentResult
>;
