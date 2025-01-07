import { BigNumber } from "bignumber.js";
import { sumBigNumber } from "./utxoSelection/lib";

const C: BigNumber = BigNumber(10 ** 12);

// note: this is an easy version of computeMass for Ledger only.
// it has usual inputs with regular Script and one or two outputs
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

function _negative_mass(inputs: BigNumber[], outputsNum: number): number {
  const inputsNum = inputs.length;
  if (outputsNum === 1 || inputsNum === 1 || (outputsNum === 2 && inputsNum === 2)) {
    return sumBigNumber(inputs.map(v => C.div(v).integerValue(BigNumber.ROUND_FLOOR))).toNumber();
  }
  return (
    inputsNum *
    C.div(sumBigNumber(inputs).div(BigNumber(inputsNum)).integerValue(BigNumber.ROUND_FLOOR))
      .integerValue(BigNumber.ROUND_FLOOR)
      .toNumber()
  );
}

export function calcStorageMass(inputs: BigNumber[], outputs: BigNumber[]): number {
  const N: number = _negative_mass(inputs, outputs.length);
  const P: number = sumBigNumber(
    outputs.map(v => C.div(v).integerValue(BigNumber.ROUND_FLOOR)),
  ).toNumber();
  return Math.max(P - N, 0);
}

export function calcTotalMass(
  inputs: BigNumber[],
  outputs: BigNumber[],
  recipientIsECDSA: boolean = false,
): number {
  return Math.max(
    calcStorageMass(inputs, outputs),
    calcComputeMass(inputs.length, outputs.length === 2, recipientIsECDSA),
  );
}
