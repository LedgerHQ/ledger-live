import { TRUSTCHAIN_APP_NAME } from "@ledgerhq/hw-ledger-key-ring-protocol";
import { DeviceManagementKitBuilder, DeviceModelId } from "@ledgerhq/device-management-kit";
import {
  createIntent,
  type DeviceConnectionResult,
  type DeviceExtractedContext,
} from "@features/platform-device-intent";
import type {
  AddMemberIntent,
  AddMemberIntentInput,
  RemoveMemberIntent,
  RemoveMemberIntentInput,
} from "@features/platform-intent-wallet-sync";
import type {
  MemberCredentials,
  Trustchain,
  TrustchainMember,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import type { InitializationInput } from "LLM/components/DeviceIntentExecutor";
import { addMemberIntentLWMDefinition } from "../addMemberIntent/intentLWMDefinition";
import { removeMemberIntentLWMDefinition } from "../removeMemberIntent/intentLWMDefinition";

export const INITIALIZATION_INPUT: InitializationInput = {
  appName: TRUSTCHAIN_APP_NAME,
  dependencies: [],
  requireLatestFirmware: false,
};

export const EXTRACTED_CONTEXT: DeviceExtractedContext = {
  currentOsVersion: "2.0.0",
  osUpdateAvailable: false,
  currentAppName: TRUSTCHAIN_APP_NAME,
  currentAppVersion: "1.0.0",
};

const MEMBER_CREDENTIALS: MemberCredentials = { pubkey: "pubkey", privatekey: "privatekey" };

const TRUSTCHAIN: Trustchain = {
  rootId: "root",
  applicationPath: "m/0'/16'/0'",
  walletSyncEncryptionKey: "key",
};

const OTHER_MEMBER: TrustchainMember = { id: "member-2", name: "Desktop", permissions: 1 };

export function buildAddMemberIntent(): AddMemberIntent {
  const input: AddMemberIntentInput = {
    memberCredentials: MEMBER_CREDENTIALS,
    createSessionSdk: jest.fn(),
  };
  return createIntent(addMemberIntentLWMDefinition, input);
}

export function buildRemoveMemberIntent(): RemoveMemberIntent {
  const input: RemoveMemberIntentInput = {
    trustchain: TRUSTCHAIN,
    memberCredentials: MEMBER_CREDENTIALS,
    member: OTHER_MEMBER,
    createSessionSdk: jest.fn(),
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
