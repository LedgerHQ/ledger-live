import { DeviceId } from "@ledgerhq/client-ids/ids";
import {
  DeviceActionStatus,
  FirmwareUpdateContext as DmkFirmwareUpdateContext,
  GetOsVersionResponse,
  type DeviceModelId as DmkDeviceModelId,
  type GetDeviceMetadataDAOutput,
} from "@ledgerhq/device-management-kit";
import {
  dmkToLedgerDeviceIdMap,
  type ConnectAppDASnapshotHandler,
  type ConnectAppDAState,
} from "@ledgerhq/live-dmk-shared";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import { parseDeviceInfo } from "../../../../deviceSDK/tasks/getDeviceInfo";
import type { ConnectAppInitSideEffects } from "../types";

export type ConnectAppSideEffectsHandlerParams = {
  sideEffects: ConnectAppInitSideEffects;
  deviceModelId: DmkDeviceModelId;
};

/**
 * Handles the side effects from the connect app device action.
 *
 * NB: those should probably be moved to a centralized side effects handler that observes the DMK state.
 */
export class ConnectAppSideEffectsHandler implements ConnectAppDASnapshotHandler {
  private lastSeenDeviceId: string | null = null;
  private lastSeenDeviceSignature: string | null = null;
  constructor(private readonly params: ConnectAppSideEffectsHandlerParams) {}

  handleSnapshot(state: ConnectAppDAState): void {
    this.observeDeviceId(state);
    this.observeLastSeenDeviceInfo(state);
  }

  private observeDeviceId(state: ConnectAppDAState): void {
    if (state.status !== DeviceActionStatus.Pending) return;
    if (!state.intermediateValue.deviceId) return;
    const deviceIdString = Buffer.from(state.intermediateValue.deviceId).toString("hex");

    if (deviceIdString !== this.lastSeenDeviceId) {
      this.lastSeenDeviceId = deviceIdString;
      this.params.sideEffects.onDeviceIdObserved(DeviceId.fromString(deviceIdString));
    }
  }

  private observeLastSeenDeviceInfo(state: ConnectAppDAState): void {
    if (state.status !== DeviceActionStatus.Pending) return;
    if (!hasDeviceMetadata(state.intermediateValue)) return;
    const payload = buildLastSeenDeviceInfoPayload({
      deviceMetadata: state.intermediateValue.deviceMetadata,
      deviceModelId: this.params.deviceModelId,
    });

    if (payload) {
      const signature = JSON.stringify(payload);

      if (signature !== this.lastSeenDeviceSignature) {
        this.lastSeenDeviceSignature = signature;
        this.params.sideEffects.onLastSeenDeviceInfoObserved(payload);
      }
    }
  }
}

function hasDeviceMetadata(value: unknown): value is { deviceMetadata: GetDeviceMetadataDAOutput } {
  return (
    typeof value === "object" &&
    value !== null &&
    "deviceMetadata" in value &&
    Boolean(value.deviceMetadata)
  );
}

export function mapDeviceInfo(osVersion: GetOsVersionResponse): DeviceInfo | null {
  if (!osVersion.seVersion) {
    return null;
  }

  return parseDeviceInfo({
    isBootloader: osVersion.isBootloader,
    rawVersion: osVersion.seVersion,
    targetId: osVersion.targetId,
    seVersion: osVersion.seVersion,
    seTargetId: osVersion.seTargetId,
    mcuBlVersion: undefined,
    mcuVersion: osVersion.mcuSephVersion,
    mcuTargetId: osVersion.mcuTargetId,
    flags: Buffer.from(osVersion.seFlags),
    bootloaderVersion: osVersion.mcuBootloaderVersion,
    hardwareVersion: Number.parseInt(osVersion.hwVersion, 16),
    languageId: osVersion.langId,
  });
}

function mapLatestFirmware(
  updateContext: DmkFirmwareUpdateContext | undefined,
): FirmwareUpdateContext | null {
  if (!updateContext?.availableUpdate) {
    return null;
  }

  const { availableUpdate } = updateContext;
  const { osuFirmware: osu, finalFirmware: final } = availableUpdate;

  return {
    osu: {
      id: osu.id,
      perso: osu.perso,
      firmware: osu.firmware,
      firmware_key: osu.firmwareKey,
      hash: osu.hash || "",
      next_se_firmware_final_version: osu.nextFinalFirmware,
      description: undefined,
      display_name: undefined,
      notes: undefined,
      name: "",
      date_creation: "",
      date_last_modified: "",
      device_versions: [],
      providers: [],
      previous_se_firmware_final_version: [],
    },
    final: {
      id: final.id,
      name: final.version,
      version: final.version,
      perso: final.perso,
      firmware: final.firmware || "",
      firmware_key: final.firmwareKey || "",
      hash: final.hash || "",
      bytes: final.bytes || 0,
      mcu_versions: final.mcuVersions,
      description: undefined,
      display_name: undefined,
      notes: undefined,
      se_firmware: 0,
      date_creation: "",
      date_last_modified: "",
      device_versions: [],
      application_versions: [],
      osu_versions: [],
      providers: [],
    },
    shouldFlashMCU: availableUpdate.mcuUpdateRequired,
  };
}

export type LastSeenDeviceInfoPayload = {
  modelId: DeviceModelId;
  deviceInfo: DeviceInfo;
  latestFirmware: FirmwareUpdateContext | null;
};

export function buildLastSeenDeviceInfoPayload(params: {
  deviceMetadata: GetDeviceMetadataDAOutput | undefined;
  deviceModelId: DmkDeviceModelId;
}): LastSeenDeviceInfoPayload | null {
  const { deviceMetadata, deviceModelId } = params;
  const metadata = deviceMetadata?.firmwareVersion.metadata;

  if (!metadata) {
    return null;
  }

  const deviceInfo = mapDeviceInfo(metadata);

  if (!deviceInfo) {
    return null;
  }

  return {
    modelId: dmkToLedgerDeviceIdMap[deviceModelId],
    deviceInfo,
    latestFirmware: mapLatestFirmware(deviceMetadata?.firmwareUpdateContext),
  };
}
