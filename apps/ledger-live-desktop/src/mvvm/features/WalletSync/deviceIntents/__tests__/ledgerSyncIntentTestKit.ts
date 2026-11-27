import { DeviceManagementKitBuilder, DeviceModelId } from "@ledgerhq/device-management-kit";
import { createIntent, type DeviceConnectionResult } from "@features/platform-device-intent";
import { mockKeyRingState } from "@domain/entity-key-ring/slice.mock";
import {
  createLedgerSyncResultOrder,
  KeyRingMemberIdSchema,
  selectKeyRingSession,
  type AddMemberIntent,
  type AddMemberIntentInput,
  type KeyRingMember,
  type RemoveMemberIntent,
  type RemoveMemberIntentInput,
} from "@features/platform-key-ring";
import { fakeKeyRingClient } from "@features/platform-key-ring/testing";
import type { InitializationInput } from "LLD/components/DeviceIntentExecutor";
import { addMemberIntentLWDDefinition } from "../addMemberIntent/intentLWDDefinition";
import { removeMemberIntentLWDDefinition } from "../removeMemberIntent/intentLWDDefinition";

export const INITIALIZATION_INPUT: InitializationInput = {
  appName: "Ledger Sync",
  dependencies: [],
  requireLatestFirmware: false,
};

const SESSION = selectKeyRingSession({ trustchain: mockKeyRingState() });

const OTHER_MEMBER: KeyRingMember = {
  id: KeyRingMemberIdSchema.parse("member-2"),
  name: "Mobile",
};

export function buildAddMemberIntent(): AddMemberIntent {
  const input: AddMemberIntentInput = {
    session: SESSION,
    client: fakeKeyRingClient(),
    resultOrder: createLedgerSyncResultOrder(),
  };
  return createIntent(addMemberIntentLWDDefinition, input);
}

export function buildRemoveMemberIntent(): RemoveMemberIntent {
  const input: RemoveMemberIntentInput = {
    session: SESSION,
    member: OTHER_MEMBER,
    client: fakeKeyRingClient(),
    resultOrder: createLedgerSyncResultOrder(),
  };
  return createIntent(removeMemberIntentLWDDefinition, input);
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
      type: "USB",
      transport: "NODE-HID",
    },
    compatDeviceId: "compat-1",
    compatDeviceName: "Ledger Stax",
    compatDeviceWired: true,
  };
}
