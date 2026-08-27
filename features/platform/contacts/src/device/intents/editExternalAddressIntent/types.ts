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
   * Reserved for the two-step composition: one step approved, the next still to
   * go. Unreachable while only the identifier step exists — see
   * `scope-edit-unsupported`.
   */
  | { readonly type: "partial-result" }
  | { readonly type: "completed" }
  /**
   * The edit changes the scope, which needs a kit method that does not exist yet
   * (DSDK-1380). Terminal, and raised before any device interaction: the scope
   * is bound into the address-level `hmacRest`, so it cannot be changed
   * host-side without invalidating the stored proof.
   */
  | { readonly type: "scope-edit-unsupported"; readonly error: Error }
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
