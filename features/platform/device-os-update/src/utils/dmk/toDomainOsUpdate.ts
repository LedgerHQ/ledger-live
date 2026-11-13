import type {
  FinalFirmware as DmkFinalFirmware,
  OsuFirmware as DmkOsuFirmware,
  OsUpdate as DmkOsUpdate,
} from "@ledgerhq/dmk-ledger-wallet";
import type { FinalFirmware, OsuFirmware, OsUpdate } from "@domain/entity-device-os-update";

function toDomainOsuFirmware(firmware: DmkOsuFirmware): OsuFirmware {
  return {
    id: firmware.id,
    perso: firmware.perso,
    hash: firmware.hash,
    notes: firmware.notes,
    firmware: firmware.firmware,
    firmwareKey: firmware.firmwareKey,
    nextFinalFirmware: firmware.nextFinalFirmware,
  };
}

function toDomainFinalFirmware(firmware: DmkFinalFirmware): FinalFirmware {
  return {
    id: firmware.id,
    perso: firmware.perso,
    hash: firmware.hash,
    version: firmware.version,
    bytes: firmware.bytes,
    firmware: firmware.firmware,
    firmwareKey: firmware.firmwareKey,
    mcuVersions: [...firmware.mcuVersions],
  };
}

/** The OS update the DMK resolved, as the entity keeps it. */
export function toDomainOsUpdate(osUpdate: DmkOsUpdate): OsUpdate {
  return {
    osuFirmware: toDomainOsuFirmware(osUpdate.osuFirmware),
    finalFirmware: toDomainFinalFirmware(osUpdate.finalFirmware),
    shouldFlashMcu: osUpdate.shouldFlashMcu,
  };
}
