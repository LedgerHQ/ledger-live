import type { DeviceModelId } from "@ledgerhq/device-management-kit";
import type {
  Intent,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";
import type { ContactDeviceIntentFailureJobState } from "../../contactsDeviceActionFailure";
import type { ContactIntentResult } from "../resultReporter";

type GroupHandle = string;
type Proof = string;

export type RenameContactIntentInput = Readonly<{
  previousContactName: string;
  newContactName: string;
  groupHandle: GroupHandle;
  hmacProof: Proof;
}>;

export type RenameContactResult = Readonly<{
  previousContactName: string;
  contactName: string;
  groupHandle: GroupHandle;
  hmacProof: Proof;
}>;

export type RenameContactJobState =
  | { readonly type: "pending" }
  /**
   * Carries the connected device so the renderer can name the product and pick
   * the matching animation: the executor hands intent components only the job
   * state, so the job is what publishes the device.
   */
  | {
      readonly type: "awaiting-device-confirmation";
      readonly deviceModelId: DeviceModelId;
      readonly deviceName: string;
    }
  | { readonly type: "completed" }
  | ContactDeviceIntentFailureJobState;

export type RenameContactIntentDefinition = IntentDefinition<
  RenameContactJobState,
  RenameContactIntentInput,
  ContactIntentResult<RenameContactResult>
>;

export type RenameContactIntentPlatformDefinition<ExtraProps = undefined> =
  IntentPlatformDefinition<
    RenameContactJobState,
    RenameContactIntentInput,
    ExtraProps,
    ContactIntentResult<RenameContactResult>
  >;

export type RenameContactIntent<ExtraProps = undefined> = Intent<
  RenameContactJobState,
  RenameContactIntentInput,
  ExtraProps,
  ContactIntentResult<RenameContactResult>
>;
