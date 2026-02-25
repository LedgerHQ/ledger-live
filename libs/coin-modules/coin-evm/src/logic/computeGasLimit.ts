export function computeIntrinsicGasLimit(defaultGasLimit: bigint, callData: Buffer): bigint {
  let intrinsicGasLimit = defaultGasLimit;
  for (let index = 0; index < callData.length; index++) {
    intrinsicGasLimit += callData[index] === 0 ? 4n : 16n;
  }

  return intrinsicGasLimit;
}
