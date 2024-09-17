export enum Options {
  SCAN = "scan",
  SHOW_QR = "showQR",
}

export type OptionsType = Options.SCAN | Options.SHOW_QR;

export enum Steps {
  AddAccountMethod = "AddAccountMethod",

  Activation = "Activation",
  ChooseSyncMethod = "ChooseSyncMethod",
  QrCodeMethod = "QrCodeMethod",
  PinDisplay = "PinDisplay",
  PinInput = "PinInput",
  SyncError = "SyncError",
  UnbackedError = "UnbackedError",
  AlreadyBacked = "AlreadyBacked",
  BackedWithDifferentSeeds = "BackedWithDifferentSeeds",
}
