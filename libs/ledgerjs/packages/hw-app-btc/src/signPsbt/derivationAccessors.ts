import { PsbtV2, psbtIn, psbtOut } from "@ledgerhq/psbtv2";
import type { DerivationAccessors, DerivationElementType } from "./types";

/**
 * Returns accessors for BIP32 derivation operations based on element type.
 */
export function getDerivationAccessors(
  psbt: PsbtV2,
  type: DerivationElementType,
): DerivationAccessors {
  if (type === "input") {
    return {
      getKeyDatas: (i, kt) => psbt.getInputKeyDatas(i, kt),
      getBip32Derivation: (i, pk) => psbt.getInputBip32Derivation(i, pk),
      getTapBip32Derivation: (i, pk) => psbt.getInputTapBip32Derivation(i, pk),
      setBip32Derivation: (i, pk, fp, p) => psbt.setInputBip32Derivation(i, pk, fp, p),
      setTapBip32Derivation: (i, pk, h, fp, p) => psbt.setInputTapBip32Derivation(i, pk, h, fp, p),
      bip32KeyType: psbtIn.BIP32_DERIVATION,
      tapBip32KeyType: psbtIn.TAP_BIP32_DERIVATION,
    };
  }
  return {
    getKeyDatas: (i, kt) => psbt.getOutputKeyDatas(i, kt),
    getBip32Derivation: (i, pk) => psbt.getOutputBip32Derivation(i, pk),
    getTapBip32Derivation: (i, pk) => psbt.getOutputTapBip32Derivation(i, pk),
    setBip32Derivation: (i, pk, fp, p) => psbt.setOutputBip32Derivation(i, pk, fp, p),
    setTapBip32Derivation: (i, pk, h, fp, p) => psbt.setOutputTapBip32Derivation(i, pk, h, fp, p),
    bip32KeyType: psbtOut.BIP_32_DERIVATION,
    tapBip32KeyType: psbtOut.TAP_BIP32_DERIVATION,
  };
}

/**
 * Generic method to check BIP32 derivation for either an input or output.
 */
export function checkElementBip32Derivation(
  accessors: DerivationAccessors,
  elementIndex: number,
  masterFp: Buffer,
): { isInternal: boolean; accountPath: number[] } {
  const keyDatas = accessors.getKeyDatas(elementIndex, accessors.bip32KeyType);
  for (const pubkey of keyDatas) {
    const derivationInfo = accessors.getBip32Derivation(elementIndex, pubkey);
    if (derivationInfo?.masterFingerprint.equals(masterFp)) {
      return extractAccountPath(derivationInfo.path);
    }
  }

  const tapKeyDatas = accessors.getKeyDatas(elementIndex, accessors.tapBip32KeyType);
  for (const pubkey of tapKeyDatas) {
    const derivationInfo = accessors.getTapBip32Derivation(elementIndex, pubkey);
    if (derivationInfo?.masterFingerprint.equals(masterFp)) {
      return extractAccountPath(derivationInfo.path);
    }
  }

  return { isInternal: false, accountPath: [] };
}

export function extractAccountPath(fullPath: number[]): {
  isInternal: true;
  accountPath: number[];
} {
  const accountPath = fullPath.length >= 2 ? fullPath.slice(0, -2) : [];
  return { isInternal: true, accountPath };
}

export function checkBip32Derivation(
  psbt: PsbtV2,
  inputIndex: number,
  masterFp: Buffer,
): { isInternal: boolean; accountPath: number[] } {
  const accessors = getDerivationAccessors(psbt, "input");
  return checkElementBip32Derivation(accessors, inputIndex, masterFp);
}

/**
 * Checks if an output has a valid BIP32 derivation with the correct master fingerprint.
 */
export function checkOutputBip32Derivation(
  psbt: PsbtV2,
  outputIndex: number,
  masterFp: Buffer,
): boolean {
  const accessors = getDerivationAccessors(psbt, "output");
  const result = checkElementBip32Derivation(accessors, outputIndex, masterFp);
  return result.isInternal;
}
