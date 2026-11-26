import { DeviceManagementKitBuilder, DeviceModelId } from "@ledgerhq/device-management-kit";
import {
  createIntent,
  type DeviceConnectionResult,
  type DeviceExtractedContext,
} from "@features/platform-device-intent";
import {
  createLedgerSyncResultOrder,
  getKeyRingDeviceInitialization,
  KeyRingMemberIdSchema,
  selectKeyRingSession,
  type AddMemberIntent,
  type AddMemberIntentInput,
  type KeyRingMember,
  type RemoveMemberIntent,
  type RemoveMemberIntentInput,
} from "@features/platform-key-ring";
import { fakeKeyRingClient } from "@features/platform-key-ring/testing";
import { mockKeyRingMemberKeyRecord } from "@domain/entity-key-ring/schema.mock";
import { mockKeyRingState } from "@domain/entity-key-ring/slice.mock";
import type { InitializationInput } from "LLM/components/DeviceIntentExecutor";
import { addMemberIntentLWMDefinition } from "../addMemberIntent/intentLWMDefinition";
import { removeMemberIntentLWMDefinition } from "../removeMemberIntent/intentLWMDefinition";

const KEY_RING_APP_NAME = getKeyRingDeviceInitialization().appRequest.appName;

export const INITIALIZATION_INPUT: InitializationInput = {
  appName: KEY_RING_APP_NAME,
  dependencies: [],
  requireLatestFirmware: false,
};

export const EXTRACTED_CONTEXT: DeviceExtractedContext = {
  currentOsVersion: "2.0.0",
  osUpdateAvailable: false,
  currentAppName: KEY_RING_APP_NAME,
  currentAppVersion: "1.0.0",
};

const MEMBER_SESSION = selectKeyRingSession({
  trustchain: mockKeyRingState({
    trustchain: null,
    memberCredentials: mockKeyRingMemberKeyRecord(),
  }),
});

const TREE_MEMBER_SESSION = selectKeyRingSession({ trustchain: mockKeyRingState() });

const OTHER_MEMBER: KeyRingMember = {
  id: KeyRingMemberIdSchema.parse("member-2"),
  name: "Desktop",
};

export function buildAddMemberIntent(): AddMemberIntent {
  const input: AddMemberIntentInput = {
    session: MEMBER_SESSION,
    client: fakeKeyRingClient(),
    resultOrder: createLedgerSyncResultOrder(),
  };
  return createIntent(addMemberIntentLWMDefinition, input);
}

export function buildRemoveMemberIntent(): RemoveMemberIntent {
  const input: RemoveMemberIntentInput = {
    session: TREE_MEMBER_SESSION,
    member: OTHER_MEMBER,
    client: fakeKeyRingClient(),
    resultOrder: createLedgerSyncResultOrder(),
  };
  return createIntent(removeMemberIntentLWMDefinition, input);
}

export function buildDeviceConnection(sessionId: string): DeviceConnectionResult {
  return {
    dmk: new DeviceManagementKitBuilder().build(),
    sessionId,
    connectedDevice: {
      id: "device-1",
      sessionId,
      modelId: DeviceModelId.STAX,
      name: "Ledger Stax",
      type: "BLE",
      transport: "RN_BLE",
    },
    compatDeviceId: "compat-1",
    compatDeviceName: "Ledger Stax",
    compatDeviceWired: false,
  };
}
