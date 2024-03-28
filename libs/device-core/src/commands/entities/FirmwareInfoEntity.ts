export type FirmwareInfoEntity = {
  isBootloader: boolean;
  rawVersion: string; // if SE seVersion, if BL blVersion
  targetId: number; // if SE seTargetId, if BL mcuTargetId
  seVersion?: string;
  mcuVersion: string; // NB historically not undefined. but will be ""
  mcuBlVersion?: string;
  mcuTargetId?: number;
  seTargetId?: number;
  flags: Buffer;
  bootloaderVersion?: string;
  hardwareVersion?: number;
  languageId?: number;
};
