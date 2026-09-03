import type { DeviceModelId } from "@ledgerhq/device-management-kit";
import type {
  Intent,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";
import type { ContactDeviceIntentFailureJobState } from "../../contactsDeviceActionFailure";
import type { ContactIntentResult } from "../resultReporter";

type ContactIdentifier = string;
type ChainId = string | number;
type BlockchainFamily = string;
type GroupHandle = string;
type Proof = string;

export type EditExternalAddressStep = "identifier" | "scope";

export type EditExternalAddressIntentInput = Readonly<{
  contactName: string;
  previousScope: string;
  newScope: string;
  previousAddress: ContactIdentifier;
  newAddress: ContactIdentifier;
  blockchainFamily: BlockchainFamily;
  chainId: ChainId;
  groupHandle: GroupHandle;
  hmacProof: Proof;
  hmacRest: Proof;
}>;

export type EditExternalAddressResult = Readonly<{
  contactName: string;
  scope: string;
  address: ContactIdentifier;
  blockchainFamily: BlockchainFamily;
  chainId: ChainId;
  groupHandle: GroupHandle;
  hmacProof: Proof;
  hmacRest: Proof;
}>;

export type EditExternalAddressJobState =
  | { readonly type: "pending" }
  /**
   * Names the step under confirmation, and carries the connected device so the
   * renderer can name the product and pick the matching animation: the executor
   * hands intent components only the job state, so the job is what publishes
   * the device.
   */
  | {
      readonly type: "awaiting-device-confirmation";
      readonly step: EditExternalAddressStep;
      readonly deviceModelId: DeviceModelId;
      readonly deviceName: string;
    }
  /**
   * The combined edit approved its identifier step and is starting its scope
   * step. Carries no payload: the device records nothing, so the intermediate
   * proof is only the next step's input and abandoning the edit here leaves the
   * stored record untouched and still valid.
   */
  | { readonly type: "partial-result" }
  | { readonly type: "completed" }
  | ContactDeviceIntentFailureJobState;

export type EditExternalAddressIntentDefinition = IntentDefinition<
  EditExternalAddressJobState,
  EditExternalAddressIntentInput,
  ContactIntentResult<EditExternalAddressResult>
>;

export type EditExternalAddressIntentPlatformDefinition<ExtraProps = undefined> =
  IntentPlatformDefinition<
    EditExternalAddressJobState,
    EditExternalAddressIntentInput,
    ExtraProps,
    ContactIntentResult<EditExternalAddressResult>
  >;

export type EditExternalAddressIntent<ExtraProps = undefined> = Intent<
  EditExternalAddressJobState,
  EditExternalAddressIntentInput,
  ExtraProps,
  ContactIntentResult<EditExternalAddressResult>
>;
