export function isNanoSOnlyWallet(devicesModelList: readonly string[]): boolean {
  return devicesModelList.length > 0 && devicesModelList.every(modelId => modelId === "nanoS");
}
