import { z } from "zod";

export const McuFirmwareSchema = z.object({
  id: z.number(),
  name: z.string(),
  fromBootloaderVersion: z.string(),
  providers: z.array(z.number()),
});

const BaseFirmwareSchema = z.object({
  id: z.number(),
  perso: z.string(),
  hash: z.string().nullable(),
});

export const OsuFirmwareSchema = BaseFirmwareSchema.extend({
  notes: z.string().nullable(),
  firmware: z.string(),
  firmwareKey: z.string(),
  nextFinalFirmware: z.number(),
});

export const FinalFirmwareSchema = BaseFirmwareSchema.extend({
  version: z.string(),
  bytes: z.number().nullable(),
  firmware: z.string().nullable(),
  firmwareKey: z.string().nullable(),
  mcuVersions: z.array(z.number()),
});

export const OsUpdateSchema = z.object({
  osuFirmware: OsuFirmwareSchema,
  finalFirmware: FinalFirmwareSchema,
  shouldFlashMcu: z.boolean(),
});

/** A hexadecimal string, prefixed with `0x`. */
export const HexaStringSchema = z.custom<`0x${string}`>(
  value => typeof value === "string" && /^0x[0-9a-fA-F]*$/.test(value),
);

export const DeviceBackupAppSchema = z.object({
  appName: z.string(),
  data: z.union([HexaStringSchema, z.undefined()]),
});

/** The apps and settings of a device, saved before its OS is updated. */
export const DeviceBackupSchema = z.object({
  languageId: z.union([z.number(), z.undefined()]),
  installedApps: z.array(DeviceBackupAppSchema),
  clsHexImage: z.union([z.string(), z.undefined()]),
  createdAt: z.date(),
});

export const RestoreStatusSchema = z.enum(["full", "partial", "outOfMemory"]);

/** How much of a backup was restored: `RestoreStatus.full`, `.partial` or `.outOfMemory`. */
export const RestoreStatus = RestoreStatusSchema.enum;

export const RestoredAppSchema = z.object({
  appName: z.string(),
  restoredApp: z.boolean(),
  restoredAppStorage: z.union([z.boolean(), z.undefined()]),
});

/** What a restore put back on the device. */
export const RestoreResultSchema = z.object({
  restoreStatus: RestoreStatusSchema,
  restoredLanguage: z.union([z.boolean(), z.undefined()]),
  restoredCLS: z.union([z.boolean(), z.undefined()]),
  restoredApps: z.union([z.array(RestoredAppSchema), z.undefined()]),
});

export const DeviceOsUpdateStateSchema = z.object({
  osUpdates: z.array(OsUpdateSchema),
  hasBackup: z.boolean(),
});

export type McuFirmware = z.infer<typeof McuFirmwareSchema>;
export type OsuFirmware = z.infer<typeof OsuFirmwareSchema>;
export type FinalFirmware = z.infer<typeof FinalFirmwareSchema>;
export type OsUpdate = z.infer<typeof OsUpdateSchema>;
export type HexaString = z.infer<typeof HexaStringSchema>;
export type DeviceBackupApp = z.infer<typeof DeviceBackupAppSchema>;
export type DeviceBackup = z.infer<typeof DeviceBackupSchema>;
export type RestoreStatus = z.infer<typeof RestoreStatusSchema>;
export type RestoredApp = z.infer<typeof RestoredAppSchema>;
export type RestoreResult = z.infer<typeof RestoreResultSchema>;
export type DeviceOsUpdateState = z.infer<typeof DeviceOsUpdateStateSchema>;
