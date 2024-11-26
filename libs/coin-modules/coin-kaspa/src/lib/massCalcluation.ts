/**
 * Calculates computeMass
 *
 * @param density - The density of the material
 * @param volume - The volume of the material
 * @returns The computed mass
 */

const C = 10 ** 12;

// note: this is an easy version of computeMass for Ledger only.
// it has usualy inputs with regular Script and one or two outputs
export function calcComputeMass(
  inputCount: number,
  isChangeAddress: boolean,
  recipientIsECDSA: boolean = false,
): number {
  let mass: number = isChangeAddress ? 918 : 506; // 506 for one output, 918 for two outputs
  mass += inputCount * 1118; // per used utxo mass increases by 1118

  // is output address is ECDSA, the mass is 11g higher
  if (recipientIsECDSA) {
    mass += 11;
  }

  return mass;
}

function _negativeMass(inputs: number[], outputsNum: number): number {
  const inputsNum = inputs.length;
  if (outputsNum === 1 || inputsNum === 1 || (outputsNum === 2 && inputsNum === 2)) {
    return inputs.reduce((acc, v) => acc + Math.floor(C / v), 0);
  }
  return inputsNum * Math.floor(C / Math.floor(inputs.reduce((acc, v) => acc + v, 0) / inputsNum));
}

export function calcStorageMass(inputs: number[], outputs: number[]): number {
  const N = _negativeMass(inputs, outputs.length);
  const P = outputs.reduce((acc, o) => acc + Math.floor(C / o), 0);
  return Math.max(P - N, 0);
}
