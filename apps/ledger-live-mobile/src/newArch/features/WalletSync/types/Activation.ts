export enum Options {
  SCAN = "scan",
  SHOW_QR = "showQR",
}

export type OptionsType = Options.SCAN | Options.SHOW_QR;

export enum Steps {
  Activation = "Activation",
  ChooseSyncMethod = "ChooseSyncMethod",
  QrCodeMethod = "QrCodeMethod",
  PinCodeInput = "PinCodeInput",
  PinCodeDisplay = "PinCodeDisplay",
}
