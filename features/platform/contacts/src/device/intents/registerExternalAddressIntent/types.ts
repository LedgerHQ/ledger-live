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

export type RegisterExternalAddressIntentInput = Readonly<{
  contactName: string;
  scope: string;
  address: ContactIdentifier;
  blockchainFamily: BlockchainFamily;
  chainId: ChainId;
  existingContactGroup?: Readonly<{ groupHandle: GroupHandle; hmacProof: Proof }>;
}>;

export type RegisterExternalAddressResult = Readonly<{
  mode: "newContactGroup" | "existingContactGroup";
  contactName: string;
  scope: string;
  address: ContactIdentifier;
  blockchainFamily: BlockchainFamily;
  chainId: ChainId;
  groupHandle: GroupHandle;
  hmacProof: Proof;
  hmacRest: Proof;
}>;

export type RegisterExternalAddressJobState =
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

export type RegisterExternalAddressIntentDefinition = IntentDefinition<
  RegisterExternalAddressJobState,
  RegisterExternalAddressIntentInput,
  ContactIntentResult<RegisterExternalAddressResult>
>;

export type RegisterExternalAddressIntentPlatformDefinition<ExtraProps = undefined> =
  IntentPlatformDefinition<
    RegisterExternalAddressJobState,
    RegisterExternalAddressIntentInput,
    ExtraProps,
    ContactIntentResult<RegisterExternalAddressResult>
  >;

export type RegisterExternalAddressIntent<ExtraProps = undefined> = Intent<
  RegisterExternalAddressJobState,
  RegisterExternalAddressIntentInput,
  ExtraProps,
  ContactIntentResult<RegisterExternalAddressResult>
>;
