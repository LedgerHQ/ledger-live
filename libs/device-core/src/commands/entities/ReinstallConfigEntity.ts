export type ReinstallConfigArgs = [
  // 0x00 = false, 0x01 = true
  ReinstallLanguagePack: 0x00 | 0x01, // 1 byte
  ReinstallCustomLockScreen: 0x00 | 0x01, // 1 byte
  ReinstallAppsNum: number, // 1 byte UINT8
  ReinstallAppDataNum: number, // 1 byte UINT8
];

// TODO: model used when getting the config from the device before a software update
// export type ReinstallConfig = {
//   languageId?: LanguageId,
//   CustomLockScreen?: CustomLockScreen,
//   reinstallApps: AppName[],
//   reinstallStorage: AppName[],
// };
