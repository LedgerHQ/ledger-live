import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { minimumNanoVersions } from "@ledgerhq/device-onboarding";
import { rnBleTransportIdentifier, rnHidTransportIdentifier } from "@ledgerhq/live-dmk-mobile";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import { DeviceModelId as LedgerDeviceModelId } from "@ledgerhq/types-devices";
import semver from "semver";

export const OsSlot = {
  Below: "below",
  On: "on",
  Above: "above",
  Latest: "latest",
} as const;

export type OsSlot = (typeof OsSlot)[keyof typeof OsSlot];

const cloudVersion = {
  stax: "1.8.0",
  flex: "1.5.0",
  apex: "1.3.0",
  nanoS: "2.1.0",
  nanoX: "2.5.0",
  nanoSP: "1.4.0",
} as const;

export class OnboardingDevice {
  constructor(
    readonly name: string,
    readonly dmkModelId: DeviceModelId,
    readonly ledgerModelId: LedgerDeviceModelId,
    readonly cloud: string,
    readonly floor: string | null,
    readonly wired: boolean,
  ) {}

  get latest(): string {
    return this.cloud;
  }

  get below(): string {
    return stepDown(this.line);
  }

  get on(): string {
    return this.line;
  }

  get above(): string {
    return stepUp(this.line);
  }

  get transport(): string {
    return this.wired ? rnHidTransportIdentifier : rnBleTransportIdentifier;
  }

  os(slot: OsSlot): string {
    if (slot === OsSlot.Below) return this.below;
    if (slot === OsSlot.On) return this.on;
    if (slot === OsSlot.Above) return this.above;
    return this.latest;
  }

  private get line(): string {
    return this.floor ?? this.cloud;
  }
}

function stepDown(version: string): string {
  const parsed = semver.parse(semver.coerce(version)?.version ?? version);
  if (!parsed) return version;
  if (parsed.patch > 0) return `${parsed.major}.${parsed.minor}.${parsed.patch - 1}`;
  if (parsed.minor > 0) return `${parsed.major}.${parsed.minor - 1}.0`;
  return `${Math.max(parsed.major - 1, 0)}.0.0`;
}

function stepUp(version: string): string {
  return semver.inc(semver.coerce(version)?.version ?? version, "patch") ?? version;
}

function nanoFloor(modelId: DeviceModelId): string | null {
  return minimumNanoVersions.get(modelId) ?? null;
}

export const devices = {
  stax: new OnboardingDevice(
    "Ledger Stax",
    DeviceModelId.STAX,
    LedgerDeviceModelId.stax,
    cloudVersion.stax,
    null,
    false,
  ),
  flex: new OnboardingDevice(
    "Ledger Flex",
    DeviceModelId.FLEX,
    LedgerDeviceModelId.europa,
    cloudVersion.flex,
    null,
    false,
  ),
  apex: new OnboardingDevice(
    "Ledger Apex",
    DeviceModelId.APEX,
    LedgerDeviceModelId.apex,
    cloudVersion.apex,
    null,
    false,
  ),
  nanoS: new OnboardingDevice(
    "Ledger Nano S",
    DeviceModelId.NANO_S,
    LedgerDeviceModelId.nanoS,
    cloudVersion.nanoS,
    null,
    true,
  ),
  nanoX: new OnboardingDevice(
    "Ledger Nano X",
    DeviceModelId.NANO_X,
    LedgerDeviceModelId.nanoX,
    cloudVersion.nanoX,
    nanoFloor(DeviceModelId.NANO_X),
    false,
  ),
  nanoSP: new OnboardingDevice(
    "Ledger Nano S Plus",
    DeviceModelId.NANO_SP,
    LedgerDeviceModelId.nanoSP,
    cloudVersion.nanoSP,
    nanoFloor(DeviceModelId.NANO_SP),
    false,
  ),
};

export function knownDeviceOf(device: OnboardingDevice): KnownDevice {
  return {
    id: "device-id",
    name: device.name,
    transport: device.transport,
    deviceModelId: device.ledgerModelId,
  };
}

export const knownStax = knownDeviceOf(devices.stax);
