export type DeviceInfoEntity = {
  mcuVersion: string;
  // the raw mcu version
  version: string;
  // the version part, without the -osu
  majMin: string;
  // the x.y part of the x.y.z-v version
  targetId: string | number;
  // a technical id
  isBootloader: boolean;
  isRecoveryMode?: boolean;
  isOSU: boolean;
  providerName: string | null | undefined;
  managerAllowed: boolean;
  pinValidated: boolean;
  // more precised raw versions
  seVersion?: string;
  mcuBlVersion?: string;
  mcuTargetId?: number;
  seTargetId?: number;
  onboarded?: boolean;
  hasDevFirmware?: boolean;
  bootloaderVersion?: string;
  hardwareVersion?: number;
  languageId?: number;
};
