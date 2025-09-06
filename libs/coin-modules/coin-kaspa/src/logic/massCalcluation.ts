import { BigNumber } from "bignumber.js";
import { sumBigNumber } from "./utxos/lib";

const C: BigNumber = BigNumber(10 ** 12);

// if one output is ECDSA, scriptPubKey is one byte longer
// which ends up in 11g mass ( 1 byte + 10g MASS_PER_SCRIPT_PUB_KEY_BYTE )
const ADDTIONAL_MASS_FOR_ECDSA_OUTPUT = 11;

// note: this is an easy version of computeMass for Ledger only.
// it has usual inputs with regular Script and one or two outputs
export function calcComputeMass(
  inputCount: number,
  isChangeAddress: boolean,
  recipientIsECDSA: boolean = false,
): number {
  // 506 for one output, 918 for two outputs
  let mass: number = isChangeAddress ? 918 : 506;

  // per used utxo mass increases by 1118
  mass += inputCount * 1118;

  // is output address is ECDSA, the mass is 11g higher
  if (recipientIsECDSA) {
    mass += ADDTIONAL_MASS_FOR_ECDSA_OUTPUT;
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
